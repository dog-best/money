// components/RewardedAd.ts
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { Platform } from "react-native";

export async function showRewardedAd(): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  const unitId = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-4533962949749202/1804000824";

  const rewarded = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<boolean>((resolve) => {
    let earned = false;
    let finished = false;

    const cleanup = () => {
      loaded();
      reward();
      closed();
      error();
    };

    const loaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => rewarded.show()
    );

    const reward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      }
    );

    const closed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(earned); // ✅ TRUE only if reward earned
      }
    );

    const error = rewarded.addAdEventListener(
      AdEventType.ERROR,
      () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(false);
      }
    );

    rewarded.load();
  });
}
