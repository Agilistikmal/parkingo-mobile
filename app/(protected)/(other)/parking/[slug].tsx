import ParkingMapView from "@/components/ui/ParkingMapView";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../context/auth";
import {
  API_ENDPOINTS,
  BookingRequest,
  getFullUrl,
  LayoutItem,
  Parking,
  ParkingSlot,
} from "../../../../lib/api";
import { COLORS } from "../../../../lib/constants";

// Define slot status types
enum SlotStatus {
  AVAILABLE = "AVAILABLE",
  SELECTED = "SELECTED",
  BOOKED = "BOOKED",
  OCCUPIED = "OCCUPIED",
}

// Map status to colors
const statusColors: Record<string, string> = {
  [SlotStatus.AVAILABLE]: "#3F3F3F",
  [SlotStatus.SELECTED]: "#A6A4F0",
  [SlotStatus.BOOKED]: "#FFBF00",
  [SlotStatus.OCCUPIED]: "#FC4261",
  DOOR: "#11CE73",
  EXIT: "#FFBDBD",
  IN: "#D1FFD4",
  ROAD: "transparent",
  EMPTY: "transparent",
};

// Component for each parking slot
interface ParkingSlotProps {
  item: LayoutItem;
  slot: ParkingSlot | null;
  onSelect: (slot: ParkingSlot) => void;
  selectedSlot: ParkingSlot | null;
}

const ParkingSlotComponent = ({
  item,
  slot,
  onSelect,
  selectedSlot,
}: ParkingSlotProps) => {
  if (item === "EMPTY") {
    return <View className="w-14 h-14 m-0.5" />;
  }

  if (item === "ROAD") {
    return <View className="w-14 h-14 bg-white/50 m-0.5" />;
  }

  if (item === "DOOR" || item === "EXIT" || item === "IN") {
    return (
      <View
        className="w-14 h-14 items-center justify-center rounded-md m-0.5"
        style={{ backgroundColor: statusColors[item] }}
      >
        <Text className="text-black font-jakarta-bold">{item}</Text>
      </View>
    );
  }

  // For parking slots
  const isSelected = selectedSlot && slot && selectedSlot.id === slot.id;
  const status = isSelected
    ? SlotStatus.SELECTED
    : slot
    ? slot.status
    : SlotStatus.AVAILABLE;
  const bgColor = statusColors[status];

  return (
    <TouchableOpacity
      className="w-14 h-14 items-center justify-center m-0.5 rounded-md"
      style={{ backgroundColor: bgColor }}
      disabled={!slot || slot.status !== "AVAILABLE"}
      onPress={() => slot && onSelect(slot)}
    >
      {slot ? (
        <Text className="text-white font-jakarta-bold">{slot.name}</Text>
      ) : (
        <Text className="text-white font-jakarta-medium">P</Text>
      )}
    </TouchableOpacity>
  );
};

export default function ParkingDetails() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const { token } = useAuth();
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking form states
  const [plateNumber, setPlateNumber] = useState("");
  const [entryTime, setEntryTime] = useState(() => {
    // Set default entry time to 30 minutes from now
    const date = new Date();
    date.setMinutes(date.getMinutes() + 30);
    return date;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState("3");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchParkingDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          getFullUrl(`${API_ENDPOINTS.PARKINGS}/slug/${slug}`)
        );
        if (!response.ok) {
          throw new Error("Failed to fetch parking details");
        }
        const data = await response.json();
        setParking(data.data);
      } catch (error) {
        console.error("Error fetching parking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParkingDetails();
  }, [slug]);

  const handleSlotSelect = (slot: ParkingSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setShowForm(false);
    } else {
      setSelectedSlot(slot);
      setShowForm(true);
    }
  };

  // Find slot by position in layout
  const findSlot = (row: number, col: number): ParkingSlot | null => {
    if (!parking?.slots) return null;

    return (
      parking.slots.find((slot) => slot.row === row && slot.col === col) || null
    );
  };

  const handleBooking = async () => {
    if (!selectedSlot || !parking) return;

    // Validate inputs
    if (!plateNumber.trim()) {
      Alert.alert("Error", "Plate number is required");
      return;
    }

    // Parse duration
    const durationHours = parseInt(duration);
    if (isNaN(durationHours) || durationHours < 3) {
      Alert.alert("Error", "Duration must be at least 3 hours");
      return;
    }

    try {
      setBookingLoading(true);

      // Create a date object with today's date but with the selected time
      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        entryTime.getHours(),
        entryTime.getMinutes()
      );

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + durationHours);

      const bookingData: BookingRequest = {
        plate_number: plateNumber,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        parking_id: parking.id,
        slot_id: selectedSlot.id,
      };

      const response = await fetch(getFullUrl(API_ENDPOINTS.BOOKINGS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to book parking slot");
      }

      // Check if payment link exists and redirect to it
      if (result.data && result.data.payment_reference) {
        // Navigate to booking details page
        router.push(`/booking/${result.data.payment_reference}`);
      } else {
        Alert.alert(
          "Booking Created",
          `Parking slot ${selectedSlot.name} booked successfully`,
          [{ text: "OK", onPress: () => router.push("/") }]
        );
      }
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert(
        "Error",
        `Failed to book slot: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      // Ensure selected time is in the future
      const now = new Date();
      const selectedDateWithToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      if (selectedDateWithToday <= now) {
        Alert.alert("Invalid Time", "Start time must be in the future.");
        return;
      }
      setEntryTime(selectedTime);
    }
  };

  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : parking ? (
        <View className="flex-1">
          {/* Header dengan back button */}
          <SafeAreaView edges={["top"]} className="bg-black">
            <View className="flex-row items-center px-4 py-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text className="text-white font-jakarta-bold text-lg flex-1">
                {parking.name}
              </Text>
            </View>
          </SafeAreaView>

          {/* Content */}
          <ScrollView className="flex-1 px-4">
            <View className="bg-white/5 rounded-3xl p-5 mb-4">
              <ParkingMapView
                latitude={parking.latitude}
                longitude={parking.longitude}
              />
              <View className="flex-row mb-3">
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={COLORS.brand}
                />
                <Text className="text-gray-400 text-sm ml-2 flex-1">
                  {parking.address}
                </Text>
              </View>

              <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons
                  name="cash"
                  size={20}
                  color={COLORS.brand}
                />
                <Text className="text-brand font-jakarta-semibold ml-2">
                  Rp {parking.default_fee.toLocaleString("id-ID")}
                </Text>
                <Text className="text-gray-400">/jam</Text>
              </View>
            </View>

            {/* Parking Layout */}
            {parking.layout && (
              <View className="bg-white/5 rounded-3xl p-4 mb-4">
                <Text className="text-white font-jakarta-bold text-lg mb-3">
                  Pilih Slot Parkir
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                >
                  <View className="items-center">
                    {parking.layout.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} className="flex-row">
                        {row.map((item, colIndex) => (
                          <ParkingSlotComponent
                            key={`slot-${rowIndex}-${colIndex}`}
                            item={item}
                            slot={findSlot(rowIndex, colIndex)}
                            onSelect={handleSlotSelect}
                            selectedSlot={selectedSlot}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Legend */}
                <View className="flex-row flex-wrap justify-center mt-4">
                  <View className="flex-row items-center mr-5 mb-2">
                    <View className="w-4 h-4 bg-[#3F3F3F] rounded mr-2" />
                    <Text className="text-gray-400 text-xs">Available</Text>
                  </View>
                  <View className="flex-row items-center mr-5 mb-2">
                    <View className="w-4 h-4 bg-[#A6A4F0] rounded mr-2" />
                    <Text className="text-gray-400 text-xs">Selected</Text>
                  </View>
                  <View className="flex-row items-center mr-5 mb-2">
                    <View className="w-4 h-4 bg-[#FFBF00] rounded mr-2" />
                    <Text className="text-gray-400 text-xs">Booked</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <View className="w-4 h-4 bg-[#FC4261] rounded mr-2" />
                    <Text className="text-gray-400 text-xs">Not Available</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Booking Form */}
            {showForm && selectedSlot && (
              <View className="bg-white/5 rounded-3xl p-4 mb-4">
                <Text className="text-white font-jakarta-bold text-lg mb-3">
                  Book Slot {selectedSlot.name}
                </Text>

                <View className="mb-4">
                  <Text className="text-white font-jakarta-medium mb-2">
                    Plate Number
                  </Text>
                  <TextInput
                    className="bg-white/10 py-3 px-4 rounded-xl text-white font-jakarta-medium"
                    placeholder="e.g., KB 4 GIL"
                    placeholderTextColor="#666"
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-white font-jakarta-medium mb-2">
                    Entry Time (Today)
                  </Text>
                  <TouchableOpacity
                    className="bg-white/10 py-3 px-4 rounded-xl flex-row justify-between items-center"
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text className="text-white font-jakarta-medium">
                      {formatTimeString(entryTime)}
                    </Text>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={entryTime}
                      mode="time"
                      display="spinner"
                      onChange={onChangeTime}
                      is24Hour={true}
                    />
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-white font-jakarta-medium mb-2">
                    Duration (hours, min 3)
                  </Text>
                  <TextInput
                    className="bg-white/10 py-3 px-4 rounded-xl text-white font-jakarta-medium"
                    placeholder="e.g., 3"
                    placeholderTextColor="#666"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="number-pad"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-white font-jakarta-medium mb-2">
                    Fee
                  </Text>
                  <View className="bg-white/10 py-3 px-4 rounded-xl">
                    <Text className="text-white font-jakarta-medium">
                      Rp{" "}
                      {(
                        parking.default_fee * parseInt(duration || "0")
                      ).toLocaleString("id-ID")}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-full py-3 items-center mb-6 ${
                selectedSlot ? "bg-brand" : "bg-gray-700"
              }`}
              onPress={handleBooking}
              disabled={!selectedSlot || bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  className={`font-jakarta-semibold text-lg ${
                    selectedSlot ? "text-black" : "text-gray-400"
                  }`}
                >
                  Book Parking
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-white text-center font-jakarta-medium mb-4">
            Could not load parking details
          </Text>
          <TouchableOpacity
            className="bg-brand px-6 py-2 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="font-jakarta-semibold text-black">Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
