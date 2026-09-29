import React from "react";
import { ScrollView, View, StyleSheet, SafeAreaView } from "react-native";
import { useAppTheme } from "../theme";
import BottomNav from "./BottomNav";

// Screen scaffolding. By default content is a plain flex view. Pass `scroll`
// on tall screens (the game screens): content becomes scrollable so chord
// buttons can never slide underneath the floating bottom nav, which is
// extracted from the children and pinned above the scroll area.
export default function ScreenWrapper({ children, scroll = false }) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  const items = React.Children.toArray(children);
  const navItems = [];
  const flowItems = [];
  for (const item of items) {
    if (item && item.type === BottomNav) navItems.push(item);
    else flowItems.push(item);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {flowItems}
      </ScrollView>
      {navItems.length > 0 && (
        <View style={styles.navLayer} pointerEvents="box-none">
          {navItems}
        </View>
      )}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 90,
  },
  navLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
