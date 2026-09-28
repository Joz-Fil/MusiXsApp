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
      <Text style={[styles.kicker, { color: colors.purpleLight }]}>MUSIXS / LIBRARY</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View style={styles.center}>
        <View style={[styles.mark, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[styles.markText, { color: colors.purpleLight }]}>♫</Text>
        </View>
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
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  mark: { width: 68, height: 68, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  markText: { fontSize: 30 },
  mutedText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});
