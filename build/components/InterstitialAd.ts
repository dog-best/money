// components/InterstitialAd.ts
let _adsModule: any | null = null;

// Lazy loader for google-mobile-ads
async function loadAdsModule() {
  if (_adsModule) return _adsModule;
  _adsModule = await import("react-native-google-mobile-ads");
  return _adsModule;
}

export async function showInterstitial(): Promise<void> {
  try {
    const ads = await loadAdsModule();

    const { InterstitialAd, AdEventType, TestIds } = ads;

    const unitId = __DEV__
      ? TestIds.INTERSTITIAL
      : "ca-app-pub-4533962949749202/2761859275"; // ← YOUR REAL ID

    const interstitial = InterstitialAd.createForAdRequest(unitId);

    return new Promise<void>((resolve, reject) => {
      const loaded = interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => {
          try {
            interstitial.show();
          } catch (e) {
            reject(e);
          }
        }
      );

      const error = interstitial.addAdEventListener(
        AdEventType.ERROR,
        (err: any) => {
          console.log("[Interstitial] Load error", err);
          loaded();
          error();
          closed();
          reject(err);
        }
      );

      const closed = interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          loaded();
          error();
          closed();
          resolve();
        }
      );

      interstitial.load();
    });
  } catch (err) {
    console.warn("Failed to load ads module:", err);
    throw err;
  }
}
