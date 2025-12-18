// components/RewardedAd.ts

import { Platform } from "react-native";

const IS_NATIVE =
  Platform.OS === "android" || Platform.OS === "ios";

let Ads: any = null;

/* -------------------------------------------------
   SAFE LAZY LOAD (BOOST STYLE)
-------------------------------------------------- */
function loadAdsSafe() {
  if (!IS_NATIVE) return null;
  if (Ads) return Ads;

  try {
    Ads = require("react-native-google-mobile-ads");
    return Ads;
  } catch {
    Ads = null;
    return null;
  }
}

/* -------------------------------------------------
   SAFE REWARDED AD
-------------------------------------------------- */
export async function showRewardedAd(
  onReward?: (reward: { amount: number; type: string }) => void
): Promise<boolean> {
  const ads = loadAdsSafe();

  if (!ads?.RewardedAd) return false;

  const {
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    TestIds,
  } = ads;

  const unitId =
    __DEV__ && TestIds
      ? TestIds.REWARDED
      : "ca-app-pub-4533962949749202/1804000824";

  const rewarded =
    RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

  return new Promise<boolean>((resolve) => {
    let unsubLoaded: any;
    let unsubEarned: any;
    let unsubClosed: any;
    let unsubError: any;

    const cleanup = () => {
      unsubLoaded?.();
      unsubEarned?.();
      unsubClosed?.();
      unsubError?.();
    };

    unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        try {
          rewarded.show();
        } catch {
          cleanup();
          resolve(false);
        }
      }
    );

    unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: any) => {
        onReward?.(reward);
      }
    );

    unsubClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        cleanup();
        resolve(true);
      }
    );

    unsubError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      () => {
        cleanup();
        resolve(false);
      }
    );

    try {
      rewarded.load();
    } catch {
      cleanup();
      resolve(false);
    }
  });
}
