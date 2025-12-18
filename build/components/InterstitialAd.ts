// components/InterstitialAd.ts
import { Platform } from "react-native";

const IS_NATIVE =
  Platform.OS === "android" || Platform.OS === "ios";

let Ads: any = null;

/* -------------------------------------------------
   SAFE LAZY LOAD (MATCH BOOST PATTERN)
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
   SAFE INTERSTITIAL SHOW
-------------------------------------------------- */
export async function showInterstitial(): Promise<void> {
  const ads = loadAdsSafe();

  // 🚫 No-op on web / unsupported platforms
  if (!ads?.InterstitialAd) return;

  const { InterstitialAd, AdEventType, TestIds } = ads;

  const unitId =
    __DEV__ && TestIds
      ? TestIds.INTERSTITIAL
      : "ca-app-pub-4533962949749202/2761859275";

  const interstitial =
    InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

  return new Promise<void>((resolve) => {
    let unsubLoaded: any;
    let unsubClosed: any;
    let unsubError: any;

    const cleanup = () => {
      unsubLoaded?.();
      unsubClosed?.();
      unsubError?.();
    };

    unsubLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        try {
          interstitial.show();
        } catch {
          cleanup();
          resolve();
        }
      }
    );

    unsubClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        cleanup();
        resolve();
      }
    );

    unsubError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        cleanup();
        resolve();
      }
    );

    try {
      interstitial.load();
    } catch {
      cleanup();
      resolve();
    }
  });
}
