import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAppTheme } from "../../theme";
import LoginModal from "./LoginModal";

export default function NotLoggedIn({ onLogin, onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const [loginVisible, setLoginVisible] = useState(false);

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to home">
        <Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.avatarText, { color: colors.purpleLight }]}>♫</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Your profile</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in or create an account to get started.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.purple }]}
          onPress={() => setLoginVisible(true)}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.purple }]}
          onPress={() => onNavigate("register")}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryText, { color: colors.purpleLight }]}>Create account</Text>
        </TouchableOpacity>
      </View>
      <BottomNav active="profile" onNavigate={onNavigate} />
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onSubmit={onLogin}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 20, marginBottom: 4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 24 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  avatarText: { fontSize: 30, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 28 },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 16, fontWeight: "700" },
});