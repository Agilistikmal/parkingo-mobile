import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS, getFullUrl, ParkingResponse } from "../../../lib/api";
import { COLORS } from "../../../lib/constants";

export default function ProtectedHome() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<ParkingResponse>({
    queryKey: ["parkings"],
    queryFn: async () => {
      const response = await fetch(getFullUrl(API_ENDPOINTS.PARKINGS));
      if (!response.ok) {
        throw new Error("Failed to fetch parkings");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-center font-jakarta-medium mb-4">
            Failed to load parking data
          </Text>
          <TouchableOpacity
            className="bg-brand px-6 py-2 rounded-full"
            onPress={() => window.location.reload()}
          >
            <Text className="font-jakarta-semibold text-black">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-black">
        <View className="px-4">
          {/* Header */}
          <View className="py-4">
            <Text className="text-white font-jakarta-bold text-2xl">
              Find Parking
            </Text>
            <Text className="text-gray-400">Choose your parking spot</Text>
          </View>

          {/* Parking List */}
          <FlatList
            data={data?.data}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-white/5 rounded-3xl p-5 mb-4 shadow-lg"
                style={{ elevation: 4 }}
                onPress={() =>
                  router.push({
                    pathname: "/parking/[slug]",
                    params: { slug: item.slug },
                  })
                }
              >
                <View>
                  <View className="mb-3">
                    <Text className="text-white font-jakarta-bold text-xl">
                      {item.name}
                    </Text>
                  </View>

                  <View className="flex-row mb-3">
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={20}
                      color={COLORS.brand}
                    />
                    <Text className="text-gray-400 text-sm ml-2 flex-1">
                      {item.address}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={20}
                        color={COLORS.brand}
                      />
                      <Text className="text-brand font-jakarta-semibold ml-2">
                        Rp {item.default_fee.toLocaleString("id-ID")}
                      </Text>
                      <Text className="text-gray-400">/jam</Text>
                    </View>
                    <TouchableOpacity
                      className="bg-brand rounded-full px-4 py-1.5 flex-row items-center"
                      onPress={() =>
                        router.push({
                          pathname: "/parking/[slug]",
                          params: { slug: item.slug },
                        })
                      }
                    >
                      <Text className="font-jakarta-semibold text-black mr-1">
                        Lihat
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={COLORS.black}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
