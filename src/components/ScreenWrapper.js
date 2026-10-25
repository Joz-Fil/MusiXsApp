import React from "react";
import { Platform, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme";
import BottomNav from "./BottomNav";
import { DynamicBackground } from "./DynamicBackground";

function isBottomNavElement(item) {
  if (!item || typeof item !== "object") return false;
  if (item.type === BottomNav) return true;
  if (item.type?.isBottomNav === true) return true;
  if (item.type?.displayName === "BottomNav") return true;
  if (item.type?.name === "BottomNav") return true;
  // Structural duck-typing: guarantees release build detection under any JS minification / Hermes bytecode
  if (item.props && typeof item.props === "object") {
    if ("active" in item.props && "onNavigate" in item.props) return true;
  }
  return false;
}

// Screen scaffolding. By default content is a plain flex view. Pass `scroll`
// on tall screens (the game screens): content becomes scrollable so chord
// buttons can never slide underneath the floating bottom nav, which is
// extracted from the children and pinned above the scroll area.
//
// Integrated with DynamicBackground to provide interactive, reactive background
// animations that respond to touches and button presses across the app.
export default function ScreenWrapper({
  children,
  scroll = false,
  dynamicBackground = true,
  bottomNav,
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const bottomNavOffset = Platform.select({
    android: Math.max(insets.bottom + 18, 34),
    ios: insets.bottom > 0 ? insets.bottom + 8 : 16,
    default: 16,
  });
  // 62 (bar height) + 38 (comfortable margin above floating bar so last item is clearly visible and touchable)
  const contentBottomPadding = bottomNavOffset + 62 + 38;

  const wrapWithBackground = (innerContent) => {
    if (!dynamicBackground) return innerContent;
    return <DynamicBackground>{innerContent}</DynamicBackground>;
  };

  const items = React.Children.toArray(children);
  const navItems = [];
  const flowItems = [];

  if (bottomNav) {
    navItems.push(bottomNav);
  }

  for (const item of items) {
    if (isBottomNavElement(item)) {
      if (!bottomNav) {
        navItems.push(item);
      }
    } else {
      flowItems.push(item);
    }
  }

  const hasNav = navItems.length > 0;

  if (!scroll) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: colors.bg }]}
      >
        {wrapWithBackground(
          <>
            <View
              style={[
                styles.content,
                hasNav && { paddingBottom: contentBottomPadding },
              ]}
            >
              {flowItems}
            </View>
            {hasNav && (
              <View style={styles.navLayer} pointerEvents="box-none">
                {navItems}
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
    >
      {wrapWithBackground(
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: hasNav ? contentBottomPadding : 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {flowItems}
          </ScrollView>
          {hasNav && (
            <View style={styles.navLayer} pointerEvents="box-none">
              {navItems}
            </View>
          )}
        </>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingTop: 12,
  },
  navLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
});
