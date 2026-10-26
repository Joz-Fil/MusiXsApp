import { dispatchResetCodeEmail } from "./emailService";
import { resetAllSessions } from "./sessionStore";
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
  verifyAccountForRecovery as localVerifyAccountForRecovery,
  resetPasswordWithIdentity as localResetPasswordWithIdentity,
  DatabaseUnavailableError,
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

/**
 * Remembers the local account so the user stays signed in after restarting
 * the app. Failing to remember the session must not undo a successful
 * sign-up / log-in, so errors are only logged.
 */
async function rememberLocalSession(userId: number): Promise<void> {
  try {
    await localSaveCurrentUser(userId);
  } catch (error) {
    console.warn("Could not save the local session; you may need to log in again next time:", error);
  }
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

      // Mirror to local SQLite so in-app account recovery and offline access always work
      try {
        await localRegisterUser({
          username: cleanUsername,
          email: cleanEmail,
          displayName: cleanDisplayName,
          avatar,
          password,
        });
      } catch (localErr) {
        // Safe to ignore if already registered locally
      }

      const cloudUser: UnifiedUser = {
        id: data.user.id,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatar,
        email: cleanEmail,
        createdAt: data.user.created_at || new Date().toISOString(),
        isCloud: true,
      };

      // The cloud session is persisted by Supabase itself (SecureStore). The
      // old `localSaveCurrentUser(1)` here pointed the local session at a
      // local user that usually doesn't exist and failed the foreign key.
      resetAllSessions();
      return cloudUser;
    } catch (cloudErr: any) {
      console.warn("Cloud SQL registration failed, falling back to local database:", cloudErr);
      // Fall through to local registration below
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
  await rememberLocalSession(localUser.id);
  resetAllSessions();

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

  if (isSupabaseConfigured() && isEmail) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanIdentifier.toLowerCase(),
        password,
      });

      if (!error && data?.user) {
        const cloudUser: UnifiedUser = {
          id: data.user.id,
          username: (data.user.user_metadata?.username as string) || cleanIdentifier.split("@")[0],
          displayName: (data.user.user_metadata?.display_name as string) || (data.user.user_metadata?.username as string) || cleanIdentifier.split("@")[0],
          avatar: (data.user.user_metadata?.avatar as string) || "🎵",
          email: data.user.email || cleanIdentifier,
          createdAt: data.user.created_at || new Date().toISOString(),
          isCloud: true,
        };
        resetAllSessions();
        return cloudUser;
      }
    } catch (cloudLoginErr) {
      console.warn("Cloud login error, checking local credentials:", cloudLoginErr);
    }
  }

  // Local SQLite login
  const user = await localLoginUser({
    identifier: cleanIdentifier,
    password,
  });

  if (!user) return null;
  await rememberLocalSession(user.id);
  resetAllSessions();

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
): Promise<{ success: boolean; code?: string; message: string; notice?: string; emailSent?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new Error("Enter a valid email address (e.g. you@gmail.com).");
  }

  // 1. Generate & persist 6-digit verification code in database
  const code = await localCreatePasswordResetCode(cleanEmail);

  // 2. Dispatch real email with the 6-digit code to user's inbox
  const dispatch = await dispatchResetCodeEmail(cleanEmail, code);

  if (dispatch.sent) {
    return {
      success: true,
      emailSent: true,
      message: `Verification code sent to ${cleanEmail}. Check your inbox!`,
      notice: `📧 Verification code dispatched to ${cleanEmail}. Please check your inbox (and spam folder).`,
    };
  }

  // 3. Fallback: If direct dispatch fails, try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (!error) {
        return {
          success: true,
          emailSent: true,
          message: `Verification code sent to ${cleanEmail}. Check your inbox!`,
          notice: `📧 Verification code dispatched to ${cleanEmail}. Please check your inbox (and spam folder).`,
        };
      }
    } catch {
      // Fallback
    }
  }

  throw new Error(
    dispatch.error || "Failed to dispatch verification email. Please check your internet connection."
  );
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
    try {
      // 1. Verify 6-digit OTP token with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "recovery",
      });
      if (!error && data?.session) {
        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) throw new Error(updateErr.message);
        return true;
      }
    } catch (e: any) {
      console.warn("Supabase OTP verify note, falling back to local verification:", e.message);
    }
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

  let local;
  try {
    local = await localGetCurrentUser();
  } catch (error) {
    // Failsafe: an unreachable database at start-up just means "signed out"
    // instead of an error screen.
    console.warn("Could not restore the local session:", error);
    return null;
  }
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
  try {
    await localClearCurrentUser();
  } catch (error) {
    // Failsafe: still sign the user out of the UI even if the local session
    // row couldn't be removed right now.
    console.warn("Could not clear the local session:", error);
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  } finally {
    resetAllSessions();
  }
}

/**
 * Verify account ownership for password recovery using registered email and username.
 */
export async function verifyAccountForRecovery(
  email: string,
  username: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (!cleanEmail || !cleanUsername) {
    throw new Error("Enter both your registered email and username.");
  }
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Enter a valid email address (e.g. you@gmail.com).");
  }

  await localVerifyAccountForRecovery(cleanEmail, cleanUsername);
  return {
    success: true,
    message: "Account verified successfully. You may now choose a new password.",
  };
}

/**
 * Reset password after identity verification (email + username match).
 */
export async function resetPasswordWithIdentity(
  email: string,
  username: string,
  newPassword: string
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (!cleanEmail || !cleanUsername) {
    throw new Error("Email and username are required.");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const success = await localResetPasswordWithIdentity(cleanEmail, cleanUsername, newPassword);

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch {
      // Non-fatal if cloud session is not active
    }
  }

  return success;
}
