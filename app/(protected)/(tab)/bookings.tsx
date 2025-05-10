import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import {
  API_ENDPOINTS,
  Booking,
  BookingsResponse,
  getFullUrl,
} from "../../../lib/api";
import { COLORS } from "../../../lib/constants";

export default function BookingsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(getFullUrl(API_ENDPOINTS.BOOKINGS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = (await response.json()) as BookingsResponse;
      setBookings(data.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "#22c55e";
      case "COMPLETED":
        return "#0ea5e9";
      case "UNPAID":
        return COLORS.brand;
      case "EXPIRED":
        return "#ef4444";
      case "CANCELLED":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      className="bg-white/5 rounded-2xl p-4 mb-4"
      onPress={() => router.push(`/booking/${item.payment_reference}`)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white font-jakarta-bold text-base flex-1 mr-2">
          {item.parking?.name}
        </Text>
        <View
          style={{
            backgroundColor: `${getStatusColor(item.status)}20`,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            style={{ color: getStatusColor(item.status) }}
            className="font-jakarta-semibold text-xs"
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row mb-2">
        <MaterialCommunityIcons name="map-marker" size={16} color="#9ca3af" />
        <Text className="text-gray-400 text-xs ml-1 flex-1">
          {item.parking?.address?.substring(0, 60)}
          {item.parking?.address && item.parking.address.length > 60
            ? "..."
            : ""}
        </Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="car" size={16} color="#9ca3af" />
          <Text className="text-gray-300 text-xs ml-1">
            {item.plate_number}
          </Text>
        </View>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="parking" size={16} color="#9ca3af" />
          <Text className="text-gray-300 text-xs ml-1">
            Slot {item.slot?.name}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-white/10">
        <View>
          <Text className="text-gray-400 text-xs">Schedule</Text>
          <Text className="text-gray-300 text-xs">
            {formatDate(item.start_at)} - {formatDate(item.end_at)}
          </Text>
        </View>

        <Text className="text-brand font-jakarta-semibold">
          Rp {item.total_fee.toLocaleString("id-ID")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-10">
      <MaterialCommunityIcons
        name="ticket-confirmation-outline"
        size={64}
        color="#6b7280"
      />
      <Text className="text-gray-400 text-center mt-4 font-jakarta-medium">
        You don't have any bookings yet
      </Text>
      <TouchableOpacity
        className="mt-4 bg-brand px-6 py-2 rounded-full"
        onPress={() => router.push("/")}
      >
        <Text className="text-black font-jakarta-semibold">Find Parking</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-white font-jakarta-bold text-xl">
          My Bookings
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.brand}
              colors={[COLORS.brand]}
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});
