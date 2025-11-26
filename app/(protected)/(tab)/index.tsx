import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS, getFullUrl, ParkingResponse } from "../../../lib/api";
import { COLORS } from "../../../lib/constants";

export default function ProtectedHome() {
  const router = useRouter();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  useEffect(() => {
    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation(null);
        return;
      }
      const location = await Location.getCurrentPositionAsync();
      setLocation(location);
    }
    getLocation();
  }, []);

  const [queryParams, setQueryParams] = useState(
    new URLSearchParams({
      search: "",
      sort_by: "created_at",
      sort_order: "desc",
      user_latitude: location?.coords.latitude.toString() || "0",
      user_longitude: location?.coords.longitude.toString() || "0",
      radius: "0",
    })
  );

  const { data, isLoading, error, refetch } = useQuery<ParkingResponse>({
    queryKey: ["parkings"],
    queryFn: async () => {
      const url =
        getFullUrl(API_ENDPOINTS.PARKINGS) + "?" + queryParams.toString();
      const response = await fetch(url);
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

          {/* Search Bar */}
          <View className="mb-4">
            <TextInput
              placeholder="Search for a parking"
              placeholderTextColor={COLORS.gray}
              className="bg-white text-black rounded-xl p-3"
              onChangeText={(text) => {
                const newQueryParams = queryParams;
                newQueryParams.set("search", text);
                setQueryParams(newQueryParams);
                refetch();
              }}
            />

            {/* Sort by and radius */}
            <View className="flex-row items-center justify-between mt-2 gap-x-2">
              {/* Select sort by */}
              <View className="flex-1 bg-white rounded-xl px-2">
                <Picker
                  dropdownIconColor={COLORS.black}
                  selectedValue={queryParams.get("sort_by") || "created_at"}
                  onValueChange={(itemValue) => {
                    const [sort_by, sort_order] = itemValue.split(":");
                    const newQueryParams = queryParams;
                    newQueryParams.set("sort_by", sort_by);
                    newQueryParams.set("sort_order", sort_order);
                    setQueryParams(newQueryParams);
                    refetch();
                  }}
                >
                  <Picker.Item
                    label="Newest"
                    value="created_at:desc"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                  <Picker.Item
                    label="Name"
                    value="name:asc"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                </Picker>
              </View>
              {/* Select radius */}
              <View className="flex-1 bg-white rounded-xl px-2">
                <Picker
                  dropdownIconColor={COLORS.black}
                  selectedValue={queryParams.get("sort_by") || "created_at"}
                  onValueChange={(itemValue) => {
                    const newQueryParams = queryParams;
                    newQueryParams.set("radius", itemValue);
                    setQueryParams(newQueryParams);
                    refetch();
                  }}
                >
                  <Picker.Item
                    label="All Radius"
                    value="0"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                  <Picker.Item
                    label="1km"
                    value="1"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                  <Picker.Item
                    label="5km"
                    value="5"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                  <Picker.Item
                    label="10km"
                    value="10"
                    color={COLORS.black}
                    style={{ fontSize: 12 }}
                  />
                </Picker>
              </View>
            </View>
          </View>

          {/* Parking List */}
          {data?.data?.length == 0 ? (
            <Text className="text-white font-jakarta-medium text-center">
              No parking found
            </Text>
          ) : (
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
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
