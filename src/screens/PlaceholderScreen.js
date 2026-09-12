import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

export default function PlaceholderScreen({ title, active, onBack, onNavigate }) {
  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtn}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.center}>
        <Text style={styles.mutedText}>
          This screen isn't built yet — coming in a later pass.
        </Text>
      </View>

      <BottomNav active={active} onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    color: colors.purpleLight,
    fontSize: 18,
    marginBottom: 4,
  },
  title: {
    color: colors.purpleLight,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
