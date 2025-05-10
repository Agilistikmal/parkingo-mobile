import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import { COLORS } from "../../../lib/constants";

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-white font-jakarta-bold text-2xl">Account</Text>
          <Text className="text-gray-400">Manage your profile</Text>
        </View>

        {/* Profile */}
        <View className="bg-white/5 rounded-3xl p-5 mb-4">
          <View className="flex-row items-center">
            <Image
              source={{ uri: user?.avatar_url }}
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className="text-white font-jakarta-bold text-lg">
                {user?.full_name}
              </Text>
              <Text className="text-gray-400">{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={logout}
          className="bg-white/5 rounded-2xl p-4 flex-row items-center"
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={COLORS.brand}
          />
          <Text className="text-brand font-jakarta-medium ml-3">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
