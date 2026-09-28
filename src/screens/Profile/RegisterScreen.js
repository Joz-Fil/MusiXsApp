import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAppTheme } from "../../theme";

export default function RegisterScreen({ onBack, onRegister }) {
  const { colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password || !confirmation) {
      setError("Complete all fields to continue.");
    } else if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
    } else if (password !== confirmation) {
      setError("Passwords do not match.");
    } else {
      setSubmitting(true);
      try {
        await onRegister({ username: username.trim(), password });
      } catch (submitError) {
        setError(submitError.message || "Unable to create an account right now.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.surface2, color: colors.text }];

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
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Join MusiXs</Text>
          <TextInput
            style={inputStyle}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
          />
          <TextInput
            style={inputStyle}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={confirmation}
            onChangeText={setConfirmation}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {!!error && <Text style={[styles.error, { color: colors.red }]}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.purple }]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {submitting ? "Creating account..." : "Create account"}
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
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 24 },
  input: { minHeight: 48, borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, fontSize: 15 },
  error: { fontSize: 13, marginBottom: 12, textAlign: "center" },
  button: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});