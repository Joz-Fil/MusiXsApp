import { supabase, isSupabaseConfigured } from "./supabase";
import {
  AppUser,
  registerUser as localRegisterUser,
  loginUser as localLoginUser,
  getCurrentUser as localGetCurrentUser,
  saveCurrentUser as localSaveCurrentUser,
  clearCurrentUser as localClearCurrentUser,
  updateUserProfile as localUpdateUserProfile,
  createPasswordResetCode as localCreatePasswordResetCode,
  resetPasswordWithCode as localResetPasswordWithCode,
} from "../db/database";

export interface UnifiedUser {
  id: string | number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  isCloud?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  password: string;
}

export interface LoginPayload {
  identifier: string; // can be email OR username
  password: string;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Register a user either in Cloud SQL (Supabase) or locally
 */
export async function registerAccount({
  username,
  email,
  displayName,
  avatar = "🎵",
  password,
}: RegisterPayload): Promise<UnifiedUser> {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanDisplayName = displayName?.trim() || cleanUsername;

  if (!cleanUsername) throw new Error("Enter a username.");
  if (!cleanEmail) throw new Error("Enter an email address.");
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address (e.g. name@example.com).");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
            avatar,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration failed: no user data returned.");

      const cloudUser: UnifiedUser = {
        id: data.user.id,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatar,
        email: cleanEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
        isCloud: true,
      };

      await localSaveCurrentUser(1);
      return cloudUser;
    } catch (cloudErr: any) {
      console.warn("Cloud SQL registration failed, falling back to local:", cloudErr);
      throw cloudErr;
    }
  }

  // Local SQLite registration
  const localUser = await localRegisterUser({
    username: cleanUsername,
    email: cleanEmail,
    displayName: cleanDisplayName,
    avatar,
    password,
  });

  return {
    id: localUser.id,
    username: localUser.username,
    displayName: localUser.displayName || localUser.username,
    avatar: localUser.avatar || "🎵",
    email: localUser.email || cleanEmail,
    createdAt: localUser.createdAt,
    isCloud: false,
  };
}

/**
 * Login a user by Email or Username
 */
export async function loginAccount({
  identifier,
  password,
}: LoginPayload): Promise<UnifiedUser | null> {
  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier || !password) {
    throw new Error("Enter your email/username and password.");
  }

  const isEmail = isValidEmail(cleanIdentifier);

  if (isSupabaseConfigured()) {
    if (!isEmail) {
      throw new Error("With Cloud SQL active, please enter your registered email address.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanIdentifier.toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password.");
    }

    if (!data.user) return null;

    const cloudUser: UnifiedUser = {
      id: data.user.id,
      username: (data.user.user_metadata?.username as string) || cleanIdentifier.split("@")[0],
      displayName: (data.user.user_metadata?.display_name as string) || (data.user.user_metadata?.username as string) || cleanIdentifier.split("@")[0],
      avatar: (data.user.user_metadata?.avatar as string) || "🎵",
      email: data.user.email || cleanIdentifier,
      createdAt: data.user.created_at || new Date().toISOString(),
      isCloud: true,
    };

    return cloudUser;
  }

  // Local SQLite login
  const user = await localLoginUser({
    identifier: cleanIdentifier,
    password,
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar || "🎵",
    email: user.email || (isEmail ? cleanIdentifier : ""),
    createdAt: user.createdAt,
    isCloud: false,
  };
}

/**
 * Update user profile (display name and avatar)
 */
export async function updateUserAccount(
  userId: string | number,
  updates: { displayName?: string; avatar?: string; username?: string }
): Promise<UnifiedUser> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar: updates.avatar,
        username: updates.username,
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Failed to update profile.");

    return {
      id: data.user.id,
      username: (data.user.user_metadata?.username as string) || "",
      displayName: (data.user.user_metadata?.display_name as string) || updates.displayName || "",
      avatar: (data.user.user_metadata?.avatar as string) || updates.avatar || "🎵",
      email: data.user.email || "",
      createdAt: data.user.created_at || new Date().toISOString(),
      isCloud: true,
    };
  }

  // Local SQLite update
  const updated = await localUpdateUserProfile(Number(userId), updates);
  return {
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName || updated.username,
    avatar: updated.avatar || "🎵",
    email: updated.email || "",
    createdAt: updated.createdAt,
    isCloud: false,
  };
}

/**
 * Send password reset code to Gmail / email
 */
export async function sendPasswordResetCode(
  email: string
): Promise<{ success: boolean; code?: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new Error("Enter a valid email address (e.g. you@gmail.com).");
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw new Error(error.message);
    return {
      success: true,
      message: `Password reset link/instructions dispatched to ${cleanEmail}.`,
    };
  }

  // Local / offline database flow with generated 6-digit verification code
  const code = await localCreatePasswordResetCode(cleanEmail);
  return {
    success: true,
    code,
    message: `Verification code sent to ${cleanEmail}. Check your inbox!`,
  };
}

/**
 * Confirm password reset with the 6-digit code
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanEmail || !cleanCode) {
    throw new Error("Email and verification code are required.");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  if (isSupabaseConfigured()) {
    // If Supabase is active, update password using active session or token
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return true;
  }

  return await localResetPasswordWithCode(cleanEmail, cleanCode, newPassword);
}

/**
 * Get the currently signed in user
 */
export async function getActiveUser(): Promise<UnifiedUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        return {
          id: data.user.id,
          username:
            (data.user.user_metadata?.username as string) ||
            (data.user.email ? data.user.email.split("@")[0] : "User"),
          displayName:
            (data.user.user_metadata?.display_name as string) ||
            (data.user.user_metadata?.username as string) ||
            (data.user.email ? data.user.email.split("@")[0] : "User"),
          avatar: (data.user.user_metadata?.avatar as string) || "🎵",
          email: data.user.email || "",
          createdAt: data.user.created_at || new Date().toISOString(),
          isCloud: true,
        };
      }
    } catch {
      // Fallback
    }
  }

  const local = await localGetCurrentUser();
  if (!local) return null;

  return {
    id: local.id,
    username: local.username,
    displayName: local.displayName || local.username,
    avatar: local.avatar || "🎵",
    email: local.email || "",
    createdAt: local.createdAt,
    isCloud: false,
  };
}

/**
 * Log out user
 */
export async function logoutAccount(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  await localClearCurrentUser();
}
