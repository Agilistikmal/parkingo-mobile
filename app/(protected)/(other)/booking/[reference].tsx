import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useAuth } from "../../../../context/auth";
import { API_ENDPOINTS, Booking, getFullUrl } from "../../../../lib/api";
import { COLORS } from "../../../../lib/constants";

// Get screen dimensions
const windowHeight = Dimensions.get("window").height;

export default function BookingDetails() {
  const router = useRouter();
  const { reference } = useLocalSearchParams();
  const { token } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [reference]);

  // Countdown timer effect
  useEffect(() => {
    if (!booking || booking.status !== "UNPAID") return;

    const expiryTime = new Date(booking.payment_expired_at).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        // Refresh booking details after expiry
        fetchBookingDetails();
        return;
      }

      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    // Initial calculation
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const fetchBookingDetails = async () => {
    if (!reference || !token) return;

    try {
      setLoading(true);
      const response = await fetch(
        getFullUrl(API_ENDPOINTS.BOOKING_BY_REFERENCE(reference as string)),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch booking details");
      }

      const data = await response.json();
      setBooking(data.data);

      // Check if payment is already expired
      if (data.data.status === "UNPAID") {
        const expiryTime = new Date(data.data.payment_expired_at).getTime();
        const now = new Date().getTime();
        setIsExpired(now > expiryTime);
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayment = () => {
    if (isExpired) {
      Alert.alert(
        "Payment Expired",
        "This payment has expired. Please make a new booking."
      );
      return;
    }

    if (booking?.payment_link) {
      setShowWebView(true);
    }
  };

  const closeWebView = () => {
    setShowWebView(false);
    // Refresh booking details after payment attempt
    fetchBookingDetails();
  };

  const formatTimeDigit = (digit: number) => {
    return digit < 10 ? `0${digit}` : digit;
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header with back button */}
      <SafeAreaView edges={["top"]} className="bg-black">
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-jakarta-bold text-lg flex-1">
            Booking Details
          </Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : booking ? (
        <ScrollView className="flex-1 px-4">
          {/* Payment Status */}
          <View
            className={`rounded-xl p-3 mb-4 ${
              booking.status === "PAID"
                ? "bg-green-900/30"
                : booking.status === "CANCELLED"
                ? "bg-red-900/30"
                : booking.status === "EXPIRED"
                ? "bg-red-900/30"
                : "bg-amber-900/30"
            }`}
          >
            <Text
              className={`text-center font-jakarta-semibold ${
                booking.status === "PAID"
                  ? "text-green-400"
                  : booking.status === "CANCELLED"
                  ? "text-red-400"
                  : booking.status === "EXPIRED"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {booking.status === "PAID"
                ? "PAID"
                : booking.status === "CANCELLED"
                ? "CANCELLED"
                : booking.status === "UNPAID"
                ? "WAITING FOR PAYMENT"
                : booking.status === "EXPIRED"
                ? "EXPIRED"
                : booking.status}
            </Text>
          </View>

          {/* Payment Countdown - Only show for UNPAID bookings */}
          {booking.status === "UNPAID" && (
            <View className="bg-black/40 border border-amber-800/30 rounded-xl p-4 mb-4">
              <Text className="text-gray-400 text-center text-sm mb-2">
                Payment Expires In:
              </Text>
              {isExpired ? (
                <Text className="text-red-500 text-center font-jakarta-bold text-xl">
                  EXPIRED
                </Text>
              ) : (
                <View className="flex-row justify-center items-center">
                  <View className="items-center mx-2">
                    <Text className="text-white font-jakarta-bold text-xl">
                      {formatTimeDigit(timeLeft.hours)}
                    </Text>
                    <Text className="text-gray-500 text-xs">Hours</Text>
                  </View>
                  <Text className="text-white text-xl font-jakarta-bold">
                    :
                  </Text>
                  <View className="items-center mx-2">
                    <Text className="text-white font-jakarta-bold text-xl">
                      {formatTimeDigit(timeLeft.minutes)}
                    </Text>
                    <Text className="text-gray-500 text-xs">Mins</Text>
                  </View>
                  <Text className="text-white text-xl font-jakarta-bold">
                    :
                  </Text>
                  <View className="items-center mx-2">
                    <Text className="text-white font-jakarta-bold text-xl">
                      {formatTimeDigit(timeLeft.seconds)}
                    </Text>
                    <Text className="text-gray-500 text-xs">Secs</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Parking Info */}
          <View className="bg-white/5 rounded-3xl p-5 mb-4">
            <Text className="text-white font-jakarta-bold text-lg mb-2">
              {booking.parking?.name}
            </Text>

            <View className="flex-row mb-3">
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={COLORS.brand}
              />
              <Text className="text-gray-400 text-sm ml-2 flex-1">
                {booking.parking?.address}
              </Text>
            </View>

            <Text className="text-gray-400 text-sm mb-2">
              Slot: <Text className="text-white">{booking.slot?.name}</Text>
            </Text>
            <Text className="text-gray-400 text-sm mb-2">
              Plate Number:{" "}
              <Text className="text-white">{booking.plate_number}</Text>
            </Text>
            <Text className="text-gray-400 text-sm mb-2">
              Reference:{" "}
              <Text className="text-white">{booking.payment_reference}</Text>
            </Text>
          </View>

          {/* Booking Time */}
          <View className="bg-white/5 rounded-3xl p-5 mb-4">
            <Text className="text-white font-jakarta-bold text-lg mb-3">
              Booking Schedule
            </Text>

            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Entry Time</Text>
              <Text className="text-white font-jakarta-medium">
                {formatDate(booking.start_at)}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Exit Time</Text>
              <Text className="text-white font-jakarta-medium">
                {formatDate(booking.end_at)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View>
                <Text className="text-gray-400 text-sm">Duration</Text>
                <Text className="text-white font-jakarta-medium">
                  {booking.total_hours} hours
                </Text>
              </View>

              <View>
                <Text className="text-gray-400 text-sm">Fee</Text>
                <Text className="text-brand font-jakarta-semibold">
                  Rp {booking.total_fee.toLocaleString("id-ID")}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Button - only show if status is UNPAID */}
          {booking.status === "UNPAID" && (
            <TouchableOpacity
              className={`rounded-full py-3 mb-6 ${
                isExpired ? "bg-gray-700" : "bg-brand"
              }`}
              onPress={handlePayment}
              disabled={isExpired}
            >
              <Text
                className={`font-jakarta-semibold text-center ${
                  isExpired ? "text-gray-400" : "text-black"
                }`}
              >
                {isExpired ? "Payment Expired" : "Pay Now"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-white text-center font-jakarta-medium mb-4">
            Could not find booking details
          </Text>
          <TouchableOpacity
            className="bg-brand px-6 py-2 rounded-full"
            onPress={() => router.push("/")}
          >
            <Text className="font-jakarta-semibold text-black">Go Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Web View Modal for Payment */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={closeWebView}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between bg-white/10 p-4">
            <Text className="text-white font-jakarta-bold text-lg">
              Payment
            </Text>
            <TouchableOpacity onPress={closeWebView}>
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {booking?.payment_link && (
            <WebView
              ref={webViewRef}
              source={{ uri: booking.payment_link }}
              style={styles.webView}
              onNavigationStateChange={(navState) => {
                // If redirected to success page or specific path, close webview
                if (navState.url.includes("payment-success")) {
                  closeWebView();
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    height: windowHeight,
  },
});
