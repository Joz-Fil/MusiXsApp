import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { colors } from "../theme";

export default function ScreenWrapper({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90, // leaves room for BottomNav
  },
});
