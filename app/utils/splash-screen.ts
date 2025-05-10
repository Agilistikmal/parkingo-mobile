import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// Keep the splash screen visible while we initialize our app
SplashScreen.preventAutoHideAsync();

export function useSplashScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only hide the splash screen when we're ready to show our app
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return {
    isReady,
    setIsReady,
  };
}

// For web, since expo-splash-screen behaves differently
export function hideSplashScreenOnWeb() {
  if (Platform.OS === "web") {
    // Remove the splash screen element directly in web
    const splashScreenElement = document.getElementById("expo-splash-screen");
    if (splashScreenElement) {
      splashScreenElement.style.display = "none";
    }
  }
}

// Default export for Expo Router requirement
export default {
  useSplashScreen,
  hideSplashScreenOnWeb,
};
