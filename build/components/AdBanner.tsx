import React, { useEffect, useState } from "react";
import { View } from "react-native";

export default function AdBanner() {
  const [BannerAd, setBannerAd] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);

  const unitId = __DEV__
    ? "ca-app-pub-3940256099942544/6300978111" // Test banner ID
    : "ca-app-pub-4533962949749202/7206578732";

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const adModule = await import("react-native-google-mobile-ads");

        if (mounted) {
          setBannerAd(() => adModule.BannerAd);
          setBannerAdSize(adModule.BannerAdSize);
        }
      } catch (error) {
        console.warn("Failed to load Google Ads module:", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Still loading the Ad SDK
  if (!BannerAd || !BannerAdSize) {
    return <View style={{ height: 0 }} />;
  }

  return (
    <View style={{ alignItems: "center", marginVertical: 10 }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        onAdFailedToLoad={(err: any) => {
          console.log("Banner failed:", err);
        }}
      />
    </View>
  );
}
