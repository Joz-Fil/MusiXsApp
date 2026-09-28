import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";

export default function StartScreen({ onStart }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <View style={[styles.brandMark, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={require("../assets/musixs-icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.kicker, { color: colors.purpleLight }]}>MUSIC STUDIO</Text>
        <Text style={[styles.title, { color: colors.text }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Your next note starts here.</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.purple }]}
          onPress={onStart}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Start exploring</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 24 },
  brandMark: {
    width: 124,
    height: 124,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  icon: { width: 96, height: 96, borderRadius: 22 },
  kicker: { fontSize: 11, fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 36, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 30 },
  button: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  buttonArrow: { color: "#ffffff", fontSize: 22, fontWeight: "500" },
});
