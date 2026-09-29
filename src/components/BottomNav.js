import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";

const TABS = [
  { key: "settings", icon: "⚙" },
  { key: "home", icon: "⌂" },
  { key: "history", icon: "▤" },
  { key: "profile", icon: "☺" },
];

export default function BottomNav({ active, onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchButton
            key={tab.key}
            style={styles.item}
            pressScale={0.86}
            pulseKey={isActive ? `active-${tab.key}` : undefined}
            onPress={() => onNavigate(tab.key)}
            accessibilityRole="button"
            accessibilityLabel={tab.key}
            accessibilityState={{ selected: isActive }}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? colors.surface2 : "transparent",
                },
                isActive && {
                  shadowColor: colors.purple,
                  shadowOpacity: 0.55,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  { color: isActive ? colors.purpleLight : colors.textMuted },
                ]}
              >
                {tab.icon}
              </Text>
            </View>
          </TouchButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    maxWidth: 420,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    alignSelf: "center",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  pill: {
    width: 44,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
});
