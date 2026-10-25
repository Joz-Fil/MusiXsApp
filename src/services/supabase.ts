import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Configuration for Cloud PostgreSQL via Supabase
// You can supply these in an .env file as:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://oxrnvwkvnryezpoatfio.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_2Nl0OIbfILduuNiBc4Lj4Q_09zjK6Vm";

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL !== "https://your-project.supabase.co" &&
    SUPABASE_ANON_KEY !== "your-anon-key" &&
    SUPABASE_URL.startsWith("https://")
  );
};

// Safe fallback for supabase client when not fully configured or package not loaded
let supabaseClient: any = null;
try {
  const { createClient } = require("@supabase/supabase-js");
  const SecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
      if (Platform.OS === "web") {
        try {
          return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
        } catch {
          return null;
        }
      }
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (Platform.OS === "web") {
        try {
          if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        } catch {}
        return;
      }
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {}
    },
    removeItem: async (key: string): Promise<void> => {
      if (Platform.OS === "web") {
        try {
          if (typeof localStorage !== "undefined") localStorage.removeItem(key);
        } catch {}
        return;
      }
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
    },
  };

  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
} catch (e) {
  supabaseClient = {
    auth: {
      signUp: async () => ({ error: { message: "Supabase not configured" } }),
      signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
      signOut: async () => ({}),
      getUser: async () => ({ data: { user: null } }),
      resetPasswordForEmail: async () => ({ error: { message: "Supabase not configured" } }),
      updateUser: async () => ({ error: { message: "Supabase not configured" } }),
    },
  };
}

export const supabase = supabaseClient;
