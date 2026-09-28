import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { useAppTheme } from "../theme";

export default function ScreenWrapper({ children }) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 100,
  },
});
