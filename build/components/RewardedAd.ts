// components/RewardedAd.ts

export async function showRewardedAd(
  onReward?: (reward: { amount: number; type: string }) => void
) {
  const {
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    TestIds,
  } = await import("react-native-google-mobile-ads");

  const unitId =
    __DEV__
      ? TestIds.REWARDED
      : "ca-app-pub-4533962949749202/1804000824";

  const rewarded = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<void>((resolve, reject) => {
    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => rewarded.show()
    );

    const earnedListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: { amount: number; type: string }) => {
        console.log("User earned reward:", reward);
        if (onReward) onReward(reward);
      }
    );

    const errorListener = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error: unknown) => {
        console.log("Rewarded error:", error);
        removeAll();
        reject(error);
      }
    );

    const closedListener = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        removeAll();
        resolve();
      }
    );

    function removeAll() {
      loadedListener();
      earnedListener();
      errorListener();
      closedListener();
    }

    rewarded.load();
  });
}
