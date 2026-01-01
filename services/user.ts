// services/user.ts
import { supabase } from "../supabase/client";
import {
  UserProfile,
  MiningData,
  ReferralData,
  BoostData,
  DailyClaimData,
  WatchEarnData,
} from "../supabase/types";

/* -------------------------------------------------------------
   Generate referral code
------------------------------------------------------------- */
export const generateReferralCode = (uid: string) =>
  uid.slice(0, 6).toUpperCase();


/* -------------------------------------------------------------
   TYPES (SERVICE CONTRACTS)
------------------------------------------------------------- */

export type ClaimResult =
  | { success: true; reward: number; dailyClaim: DailyClaimData }
  | { success: false; reason: "cooldown" | "fetch_failed" | "update_failed" };


/* -------------------------------------------------------------
   CREATE USER AFTER REGISTER
------------------------------------------------------------- */
export async function createUserInFirestore(referredBy: string | null = null) {
  const { data: authUser, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser?.user) {
    console.warn("No supabase auth user available.", authError);
    return null;
  }

  const uid = authUser.user.id;

  const profile = {
    user_id: uid,
    username: "",
    avatar_url: null,
    referral_code: generateReferralCode(uid),
    referred_by: referredBy,
  };

  const mining = {
    user_id: uid,
    mining_active: false,
    last_start: null,
    last_claim: null,
    balance: 0,
  };

  const referrals = {
    user_id: uid,
    total_referred: 0,
    referred_users: [],
  };

  const boost = {
    user_id: uid,
    used_today: 0,
    last_reset: null,
    balance: 0,
  };

  const dailyClaim = {
    user_id: uid,
    last_claim: null,
    streak: 0,
    total_earned: 0,
  };

  const watchEarn = {
    user_id: uid,
    total_watched: 0,
    total_earned: 0,
  };

  const ops = [
    supabase.from("user_profiles").upsert(profile, { onConflict: "user_id" }),
    supabase.from("mining_data").upsert(mining, { onConflict: "user_id" }),
    supabase.from("referral_data").upsert(referrals, { onConflict: "user_id" }),
    supabase.from("boost_data").upsert(boost, { onConflict: "user_id" }),
    supabase
      .from("daily_claim_data")
      .upsert(dailyClaim, { onConflict: "user_id" }),
    supabase
      .from("watch_earn_data")
      .upsert(watchEarn, { onConflict: "user_id" }),
  ];

  const results = await Promise.all(ops);

  for (const r of results) {
    if (r.error) console.error("Upsert error:", r.error);
  }

  return true;
}


/* -------------------------------------------------------------
   GET USER DATA
------------------------------------------------------------- */
export async function getUserData(uid: string) {
  const [
    profileRes,
    miningRes,
    referralsRes,
    boostRes,
    dailyRes,
    watchRes,
  ] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", uid).single(),
    supabase.from("mining_data").select("*").eq("user_id", uid).single(),
    supabase.from("referral_data").select("*").eq("user_id", uid).single(),
    supabase.from("boost_data").select("*").eq("user_id", uid).single(),
    supabase.from("daily_claim_data").select("*").eq("user_id", uid).single(),
    supabase.from("watch_earn_data").select("*").eq("user_id", uid).single(),
  ]);

  if (profileRes.error && profileRes.error.code === "PGRST116") {
    return null;
  }

  return {
    profile: profileRes.data,
    mining: miningRes.data,
    referrals: referralsRes.data,
    boost: boostRes.data,
    dailyClaim: dailyRes.data,
    watchEarn: watchRes.data,
  };
}

/* -------------------------------------------------------------
   START MINING
------------------------------------------------------------- */
export async function startMining(uid: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("mining_data")
    .update({
      mining_active: true,
      last_start: now,
      last_stop: null,
    })
    .eq("user_id", uid)
    .select()
    .single();

  if (error) throw error;
  return data;
}


/* -------------------------------------------------------------
   STOP MINING
------------------------------------------------------------- */
export async function stopMining(uid: string) {
  const { error } = await supabase
    .from("mining_data")
    .update({ mining_active: false })
    .eq("user_id", uid);

  if (error) throw error;
}


/* -------------------------------------------------------------
   CLAIM MINING REWARD
------------------------------------------------------------- */
export async function claimMiningReward(uid: string) {
  // 1️⃣ fetch mining data
  const { data: mining, error: mErr } = await supabase
    .from("mining_data")
    .select("*")
    .eq("user_id", uid)
    .single();

  if (mErr || !mining) return 0;

  // 2️⃣ fetch active config
  const { data: config, error: cErr } = await supabase
    .from("mining_config")
    .select("*")
    .eq("is_active", true)
    .single();

  if (cErr || !config) return 0;

  const now = new Date();

  const lastCheckpoint = mining.last_claim
    ? new Date(mining.last_claim)
    : mining.last_start
    ? new Date(mining.last_start)
    : null;

  if (!lastCheckpoint) return 0;

  const elapsedSeconds = Math.floor(
    (now.getTime() - lastCheckpoint.getTime()) / 1000
  );

  if (elapsedSeconds <= 0) return 0;

  // 3️⃣ use CONFIG values (🔥 NO HARDCODE)
  const cappedSeconds = Math.min(
    elapsedSeconds,
    config.duration_seconds
  );

  const reward =
    (cappedSeconds / config.duration_seconds) * config.daily_max;

  // 4️⃣ atomic update (race-safe)
  let query = supabase
    .from("mining_data")
    .update({
      balance: Number(mining.balance ?? 0) + reward,
      last_claim: now.toISOString(),
      mining_active: false,
      last_start: null,
    })
    .eq("user_id", uid);

  if (mining.last_claim) {
    query = query.eq("last_claim", mining.last_claim);
  }

  const { data: updated, error: uErr } = await query
    .select()
    .single();

  if (uErr || !updated) return 0;

  return reward;
}


/* -------------------------------------------------------------
   REGISTER REFERRAL
------------------------------------------------------------- */
export async function registerReferral(
  referrerCode: string,
  newUserUid: string
) {
  const ref = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("referral_code", referrerCode)
    .maybeSingle();

  if (ref.error || !ref.data) return null;

  const referrerUid = ref.data.user_id;

  const rfetch = await supabase
    .from("referral_data")
    .select("*")
    .eq("user_id", referrerUid)
    .single();

  if (rfetch.error || !rfetch.data) return null;

  const current = rfetch.data as any;
  const newReferred = [...(current.referred_users ?? []), newUserUid];

  const upd = await supabase
    .from("referral_data")
    .update({
      total_referred: newReferred.length,
      referred_users: newReferred,
    })
    .eq("user_id", referrerUid);

  if (upd.error) return null;
  return true;
}

/* -------------------------------------------------------------
   BOOST REWARD
------------------------------------------------------------- */
export async function claimBoostReward(uid: string) {
  const [bRes, mRes] = await Promise.all([
    supabase.from("boost_data").select("*").eq("user_id", uid).single(),
    supabase.from("mining_data").select("*").eq("user_id", uid).single(),
  ]);

  if (bRes.error || mRes.error) return 0;

  const boost = bRes.data as any;
  const mining = mRes.data as any;

  const now = new Date();
  const lastReset = boost.last_reset ? new Date(boost.last_reset) : null;

  if (!lastReset || now.getTime() - lastReset.getTime() >= 24 * 3600 * 1000) {
    const reset = await supabase
      .from("boost_data")
      .update({ used_today: 0, last_reset: now.toISOString() })
      .eq("user_id", uid);

    if (reset.error) return 0;

    boost.used_today = 0;
    boost.last_reset = now.toISOString();
  }

  if (boost.used_today >= 3) return 0;

  const REWARD = 0.1;

  const [updateMining, updateBoost] = await Promise.all([
    supabase
      .from("mining_data")
      .update({ balance: (mining.balance ?? 0) + REWARD })
      .eq("user_id", uid),
    supabase
      .from("boost_data")
      .update({
        used_today: boost.used_today + 1,
        last_reset: now.toISOString(),
        balance: (boost.balance ?? 0) + REWARD,
      })
      .eq("user_id", uid),
  ]);

  if (updateMining.error || updateBoost.error) return 0;

  return {
  reward: REWARD,
  boost: {
    user_id: uid,
    used_today: boost.used_today + 1,
    last_reset: now.toISOString(),
    balance: (boost.balance ?? 0) + REWARD,
  },
};

}

/* -------------------------------------------------------------
   DAILY CLAIM
------------------------------------------------------------- */
export async function claimDailyReward(
  uid: string
): Promise<ClaimResult> {
  const [dRes, mRes] = await Promise.all([
    supabase.from("daily_claim_data").select("*").eq("user_id", uid).single(),
    supabase.from("mining_data").select("*").eq("user_id", uid).single(),
  ]);

  if (dRes.error || mRes.error || !dRes.data || !mRes.data) {
    return { success: false, reason: "fetch_failed" };
  }

  const daily = dRes.data as DailyClaimData;
  const mining = mRes.data as any;

  const now = new Date();
  const lastClaim = daily.last_claim ? new Date(daily.last_claim) : null;
  const DAY = 24 * 60 * 60 * 1000;

  // ⏳ cooldown
  if (lastClaim && now.getTime() - lastClaim.getTime() < DAY) {
    return { success: false, reason: "cooldown" };
  }

  // 🔄 streak reset after missed day
  let streak = daily.streak ?? 0;
  if (lastClaim && now.getTime() - lastClaim.getTime() >= DAY * 2) {
    streak = 0;
  }

  streak += 1;

  // 🎁 reward calculation
  let reward = 0.1 * streak;
  if (streak === 7) reward = 2;

  const newTotalEarned = (daily.total_earned ?? 0) + reward;
  const newBalance = (mining.balance ?? 0) + reward;
  const nowIso = now.toISOString();

  const [uMining, uDaily] = await Promise.all([
    supabase
      .from("mining_data")
      .update({ balance: newBalance })
      .eq("user_id", uid),
    supabase
      .from("daily_claim_data")
      .update({
        last_claim: nowIso,
        streak,
        total_earned: newTotalEarned,
      })
      .eq("user_id", uid),
  ]);

  if (uMining.error || uDaily.error) {
    return { success: false, reason: "update_failed" };
  }

  // ✅ SUCCESS (this is what was missing before)
  return {
    success: true,
    reward,
    dailyClaim: {
      user_id: uid,
      last_claim: nowIso,
      streak,
      total_earned: newTotalEarned,
    },
  };
}


/* -------------------------------------------------------------
   WATCH & EARN
------------------------------------------------------------- */
export async function claimWatchEarnReward(uid: string) {
  const [wRes, mRes] = await Promise.all([
    supabase.from("watch_earn_data").select("*").eq("user_id", uid).single(),
    supabase.from("mining_data").select("*").eq("user_id", uid).single(),
  ]);

  if (wRes.error || mRes.error) return 0;

  const watch = wRes.data as any;
  const mining = mRes.data as any;

  const REWARD = 0.01;

  const [uMining, uWatch] = await Promise.all([
    supabase
      .from("mining_data")
      .update({ balance: (mining.balance ?? 0) + REWARD })
      .eq("user_id", uid),
    supabase
      .from("watch_earn_data")
      .update({
        total_watched: (watch.total_watched ?? 0) + 1,
        total_earned: (watch.total_earned ?? 0) + REWARD,
      })
      .eq("user_id", uid),
  ]);

  if (uMining.error || uWatch.error) return 0;

  return REWARD;
}