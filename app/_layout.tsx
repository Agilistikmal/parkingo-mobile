import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/auth";
import { hideSplashScreenOnWeb, useSplashScreen } from "./utils/splash-screen";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isReady, setIsReady } = useSplashScreen();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) {
      // Set navigation bar color (Android only)
      if (Platform.OS === "android") {
        NavigationBar.setBackgroundColorAsync("#000000");
        NavigationBar.setButtonStyleAsync("light");
      }

      // Web specific splash screen handling
      hideSplashScreenOnWeb();

      // Mark app as ready to show, which will hide the splash screen
      setIsReady(true);
    }
  }, [fontsLoaded, fontError, setIsReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <Slot />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
