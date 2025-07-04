import { COLORS } from "@/lib/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

interface MapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export default function ParkingMapView({
  latitude,
  longitude,
  title,
  description,
}: MapViewProps) {
  function openGoogleMaps() {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  return (
    <TouchableOpacity
      onPress={openGoogleMaps}
      className="w-full h-40 rounded-xl overflow-hidden mb-3"
    >
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        minZoomLevel={17}
        maxZoomLevel={20}
      >
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title={title}
          description={description}
        />
      </MapView>
      <View className="absolute bottom-2 right-2">
        <View className="bg-black/70 px-3 py-1 rounded-full flex-row items-center">
          <MaterialCommunityIcons
            name="google-maps"
            size={16}
            color={COLORS.brand}
          />
          <Text className="text-white text-xs ml-1">Open in Maps</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
