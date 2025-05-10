import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../context/auth";

// Initialize WebBrowser for authentication
WebBrowser.maybeCompleteAuthSession();

const LOGO_URI = require("../../assets/images/logo.png");

export default function Login() {
  const { isLoading, setTokenAndAuthenticate } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);

      // Get the authentication URL from API
      const redirectUrl = encodeURIComponent(Linking.createURL("/"));
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.authenticate}?redirect_url=${redirectUrl}`
      );

      const data = await response.json();

      if (!data.data?.url) {
        throw new Error("Invalid authentication URL");
      }

      // Open authentication in browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.data.url,
        Linking.createURL("/")
      );

      if (result.type === "success" && result.url) {
        try {
          // Extract token from URL
          const url = new URL(result.url);
          const token = url.searchParams.get("token");

          if (token) {
            // Store token and authenticate user
            await SecureStore.setItemAsync("auth_token", token);
            setTokenAndAuthenticate(token);

            // Navigate to home
            router.replace("/");
          }
        } catch (error) {
          console.error("Error extracting token:", error);
          Alert.alert("Login Error", "Failed to process login response");
        }
      } else if (result.type === "cancel") {
        console.log("Authentication cancelled");
      } else {
        Alert.alert("Login Error", "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert(
        "Login Error",
        "Could not connect to authentication service. Please try again later."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center pt-24 px-6">
        <View className="items-center mb-8">
          <Image
            source={LOGO_URI}
            contentFit="contain"
            className="rounded-xl h-24 aspect-video"
          />

          {/* Main slogan */}
          <Text className="text-brand font-jakarta-bold text-2xl text-center">
            Solusi Pintar Parkir Modern
          </Text>
          <Text className="text-accent font-jakarta-medium text-base text-center mt-2">
            Parkir lebih mudah, cepat, dan aman
          </Text>
        </View>

        {/* Value propositions */}
        <View className="w-full mb-12">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-brand rounded-full items-center justify-center mr-3">
              <Ionicons name="time-outline" size={20} color="#181818" />
            </View>
            <Text className="flex-1 text-white font-jakarta-medium">
              Hemat waktu dengan sistem parkir otomatis
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-brand rounded-full items-center justify-center mr-3">
              <Ionicons name="wallet-outline" size={20} color="#181818" />
            </View>
            <Text className="flex-1 text-white font-jakarta-medium">
              Pembayaran digital yang aman dan praktis
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-brand rounded-full items-center justify-center mr-3">
              <Ionicons name="location-outline" size={20} color="#181818" />
            </View>
            <Text className="flex-1 text-white font-jakarta-medium">
              Temukan lokasi parkir terdekat dengan mudah
            </Text>
          </View>
        </View>

        {/* Bottom sheet style container */}
        <View className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-3xl px-6 pb-24 pt-6">
          <TouchableOpacity
            style={{ elevation: 4 }}
            className="w-full h-12 bg-white rounded-3xl items-center justify-center flex-row mb-2"
            onPress={handleGoogleLogin}
            disabled={isLoading || authLoading}
          >
            {isLoading || authLoading ? (
              <ActivityIndicator color="#181818" />
            ) : (
              <React.Fragment>
                <Ionicons
                  name="logo-google"
                  size={20}
                  color="#181818"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-black font-jakarta-semibold text-lg">
                  Continue with Google
                </Text>
              </React.Fragment>
            )}
          </TouchableOpacity>

          <View className="absolute bottom-5 left-0 right-0">
            <Text className="font-jakarta-semibold text-black text-xs text-center opacity-60">
              Proyek Utama Informatika
            </Text>
            <Text className="text-black text-xs text-center opacity-60">
              Agil Ghani Istikmal
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
