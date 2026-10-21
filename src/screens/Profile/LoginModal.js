import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../../theme";
import {
  isValidEmail,
  sendPasswordResetCode,
  confirmPasswordReset,
} from "../../services/authService";

export default function LoginModal({ visible, onClose, onSubmit }) {
  const { colors } = useAppTheme();
  // viewMode: "login" | "forgot_email" | "forgot_code"
  const [viewMode, setViewMode] = useState("login");

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [infoNotice, setInfoNotice] = useState("");

  const resetAll = () => {
    setViewMode("login");
    setIdentifier("");
    setPassword("");
    setError("");
    setSuccessMsg("");
    setShowPassword(false);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setInfoNotice("");
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const submitLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError("Please enter your email or username and password.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setSubmitting(true);
    try {
      const success = await onSubmit({
        identifier: cleanId,
        username: cleanId,
        password,
      });
      if (!success) {
        setError("Invalid email/username or password.");
        return;
      }
      close();
    } catch (submitError) {
      setError(submitError.message || "Unable to log in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetCode = async () => {
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError("Please enter a valid Gmail / email address.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await sendPasswordResetCode(cleanEmail);
      setInfoNotice(`📧 Verification code sent to ${cleanEmail}. Please check your Gmail inbox.`);
      setViewMode("forgot_code");
    } catch (err) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReset = async () => {
    const cleanCode = resetCode.trim();
    if (!cleanCode) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must contain at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await confirmPasswordReset(resetEmail.trim(), cleanCode, newPassword);
      setSuccessMsg("✓ Password reset successfully! You can now log in.");
      setIdentifier(resetEmail.trim());
      setViewMode("login");
    } catch (err) {
      setError(err.message || "Failed to reset password. Check your code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Success Message Banner */}
            {!!successMsg && (
              <View style={[styles.successBox, { backgroundColor: colors.greenBg }]}>
                <Text style={[styles.successText, { color: colors.green }]}>{successMsg}</Text>
              </View>
            )}

            {/* VIEW 1: Standard Login Form */}
            {viewMode === "login" && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Log in to MusiXs</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Enter your email or username to access your saved chord sessions.
                </Text>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Email or Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="you@gmail.com or username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (error) setError("");
                  }}
                />

                <View style={styles.passwordHeader}>
                  <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                    Password
                  </Text>
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    <Text style={[styles.showToggle, { color: colors.purpleLight }]}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError("");
                  }}
                  onSubmitEditing={submitLogin}
                />

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => {
                    setError("");
                    setSuccessMsg("");
                    setResetEmail(identifier.includes("@") ? identifier : "");
                    setViewMode("forgot_email");
                  }}
                >
                  <Text style={[styles.forgotText, { color: colors.purpleLight }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
                    <Text style={[styles.error, { color: colors.red }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.purple }]}
                  onPress={submitLogin}
                  disabled={submitting}
                  accessibilityRole="button"
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryText}>Log in</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* VIEW 2: Forgot Password - Step 1: Send Code */}
            {viewMode === "forgot_email" && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Enter your registered Gmail or email address. We'll send you a 6-digit verification code.
                </Text>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Gmail / Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="you@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="done"
                  value={resetEmail}
                  onChangeText={(val) => {
                    setResetEmail(val);
                    if (error) setError("");
                  }}
                  onSubmitEditing={handleSendResetCode}
                />

                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
                    <Text style={[styles.error, { color: colors.red }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.purple }]}
                  onPress={handleSendResetCode}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryText}>Send verification code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => {
                    setError("");
                    setViewMode("login");
                  }}
                >
                  <Text style={[styles.backToLoginText, { color: colors.purpleLight }]}>
                    ← Back to Log in
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* VIEW 3: Forgot Password - Step 2: Verify Code & Set New Password */}
            {viewMode === "forgot_code" && (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Enter Code</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  We sent a 6-digit code to {resetEmail}.
                </Text>

                {!!infoNotice && (
                  <View style={[styles.infoNoticeBox, { backgroundColor: colors.surface2, borderColor: colors.purple }]}>
                    <Text style={[styles.infoNoticeText, { color: colors.purpleLight }]}>
                      {infoNotice}
                    </Text>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: colors.text }]}>6-Digit Verification Code</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="next"
                  value={resetCode}
                  onChangeText={(val) => {
                    setResetCode(val);
                    if (error) setError("");
                  }}
                />

                <View style={styles.passwordHeader}>
                  <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                    New Password
                  </Text>
                  <TouchableOpacity onPress={() => setShowNewPassword((p) => !p)}>
                    <Text style={[styles.showToggle, { color: colors.purpleLight }]}>
                      {showNewPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showNewPassword}
                  returnKeyType="next"
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (error) setError("");
                  }}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showNewPassword}
                  returnKeyType="done"
                  value={confirmNewPassword}
                  onChangeText={(val) => {
                    setConfirmNewPassword(val);
                    if (error) setError("");
                  }}
                  onSubmitEditing={handleConfirmReset}
                />

                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
                    <Text style={[styles.error, { color: colors.red }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.purple }]}
                  onPress={handleConfirmReset}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryText}>Update password</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.forgotActionsRow}>
                  <TouchableOpacity onPress={handleSendResetCode} disabled={submitting}>
                    <Text style={[styles.resendCodeText, { color: colors.purpleLight }]}>
                      Resend code
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setError("");
                      setViewMode("login");
                    }}
                  >
                    <Text style={[styles.backToLoginText, { color: colors.textMuted }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity onPress={close} accessibilityRole="button" style={styles.closeHit}>
              <Text style={[styles.cancel, { color: colors.textMuted }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
  },
  scrollCenter: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  showToggle: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 14,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: "700",
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  error: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  successBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  infoNoticeBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoNoticeText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  backToLoginBtn: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: "700",
  },
  forgotActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  resendCodeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  closeHit: {
    marginTop: 16,
    alignItems: "center",
  },
  cancel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
