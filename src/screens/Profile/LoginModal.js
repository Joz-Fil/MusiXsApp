import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../theme";

export default function LoginModal({ visible, onClose, onSubmit }) {
  const { colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setUsername("");
    setPassword("");
    setError("");
    onClose();
  };

  const submit = async () => {
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    try {
      if (!(await onSubmit({ username: username.trim(), password }))) {
        setError("Username or password is incorrect.");
        return;
      }
      close();
    } catch (submitError) {
      setError(submitError.message || "Unable to log in right now.");
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
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Log in</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }]}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          {!!error && <Text style={[styles.error, { color: colors.red }]}>{error}</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.purple }]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{submitting ? "Signing in..." : "Log in"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} accessibilityRole="button">
            <Text style={[styles.cancel, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    padding: 24,
  },
  panel: { borderRadius: 16, borderWidth: 1, padding: 22 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 18, textAlign: "center" },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, fontSize: 15 },
  error: { fontSize: 13, marginBottom: 12, textAlign: "center" },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  cancel: { textAlign: "center", marginTop: 16, fontSize: 14 },
});