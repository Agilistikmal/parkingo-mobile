import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";

export default function ProtectedHome() {
  const { logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-jakarta-bold mb-8 text-white">
          Hello World
        </Text>

        <TouchableOpacity
          style={{ elevation: 4 }}
          className="w-full h-12 bg-[#FFBF00] rounded-3xl items-center justify-center flex-row"
          onPress={logout}
        >
          <Text className="text-[#181818] font-jakarta-semibold text-lg">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
