import * as Linking from "expo-linking";
import { router, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string;
  google_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  setTokenAndAuthenticate: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthResponse {
  data: {
    url: string;
  };
}

function useProtectedRoute(isAuthenticated: boolean) {
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load token on startup
  useEffect(() => {
    loadToken();
  }, []);

  // Handle deep linking
  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  // Fetch user data when token changes
  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setUser(null);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      logout();
    }
  };

  const loadToken = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync("auth_token");
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error loading token:", error);
    }
  };

  const handleDeepLink = async (event: { url: string }) => {
    try {
      const url = new URL(event.url);
      const token = url.searchParams.get("token");

      if (token) {
        // Store token securely
        await SecureStore.setItemAsync("auth_token", token);
        setToken(token);
        setIsAuthenticated(true);

        // Navigate to protected route - this will automatically close the browser
        router.replace("/");
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    }
  };

  useProtectedRoute(isAuthenticated);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Get the authentication URL from your API
      const redirectUrl = encodeURIComponent(Linking.createURL("/"));
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.authenticate}?redirect_url=${redirectUrl}`
      );
      const data = (await response.json()) as AuthResponse;

      // Open the authentication URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.data.url,
        Linking.createURL("/")
      );

      if (result.type === "success") {
        // The auth flow will be handled by handleDeepLink
        console.log("Auth session completed");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Clear stored token
      await SecureStore.deleteItemAsync("auth_token");
      setToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTokenAndAuthenticate = (token: string) => {
    setToken(token);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        signInWithGoogle,
        logout,
        isLoading,
        token,
        user,
        setTokenAndAuthenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
