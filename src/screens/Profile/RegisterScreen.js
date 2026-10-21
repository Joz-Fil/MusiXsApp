import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAppTheme } from "../../theme";
import { isValidEmail } from "../../services/authService";

export default function RegisterScreen({ onBack, onRegister }) {
  const { colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirmation) {
      setError("Please complete all fields to continue.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address (e.g. you@example.com).");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onRegister({
        username: cleanUsername,
        email: cleanEmail,
        password,
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to create an account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
  ];

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to profile">
        <Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={[styles.kicker, { color: colors.purpleLight }]}>MUSIXS / ACCOUNT</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Join MusiXs to sync and save your chord progressions across devices.
          </Text>

          <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
          <TextInput
            style={inputStyle}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (error) setError("");
            }}
            returnKeyType="next"
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
          <TextInput
            style={inputStyle}
            placeholder="MusicianHandle"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={(val) => {
              setUsername(val);
              if (error) setError("");
            }}
            returnKeyType="next"
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
            style={inputStyle}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (error) setError("");
            }}
            returnKeyType="next"
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
          <TextInput
            style={inputStyle}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={confirmation}
            onChangeText={(val) => {
              setConfirmation(val);
              if (error) setError("");
            }}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
              <Text style={[styles.error, { color: colors.red }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.purple }]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={onBack}
            accessibilityRole="button"
          >
            <Text style={[styles.loginLinkText, { color: colors.purpleLight }]}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 20, marginBottom: 4 },
  body: { flex: 1 },
  form: { flexGrow: 1, justifyContent: "center", paddingBottom: 24 },
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 6, letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 4,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  showToggle: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  error: { fontSize: 13, lineHeight: 18 },
  button: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  loginLink: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
