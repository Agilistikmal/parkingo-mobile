import { AppleMaps, GoogleMaps } from "expo-maps";
import { Platform, Text } from "react-native";

export default function MapView({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        style={{ flex: 1 }}
        cameraPosition={{
          coordinates: {
            latitude,
            longitude,
          },
          zoom: 15,
        }}
        markers={[
          {
            coordinates: {
              latitude,
              longitude,
            },
          },
        ]}
      />
    );
  } else if (Platform.OS === "android") {
    return (
      <GoogleMaps.View
        style={{ flex: 1 }}
        cameraPosition={{
          coordinates: {
            latitude,
            longitude,
          },
        }}
        markers={[
          {
            coordinates: {
              latitude,
              longitude,
            },
          },
        ]}
      />
    );
  } else {
    return <Text>Map not supported</Text>;
  }
}
