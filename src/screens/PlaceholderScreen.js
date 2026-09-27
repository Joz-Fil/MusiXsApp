import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

export default function PlaceholderScreen({ title, active, onBack, onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.purpleLight }]}>{title}</Text>

      <View style={styles.center}>
        <Text style={[styles.mutedText, { color: colors.textMuted }]}>
          This screen isn't built yet — coming in a later pass.
        </Text>
      </View>

      <BottomNav active={active} onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  mutedText: { fontSize: 14, textAlign: "center" },
});
