import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";

const TABS = [
  { key: "settings", icon: "⚙", label: "Settings" },
  { key: "home", icon: "⌂", label: "Home" },
  { key: "history", icon: "▤", label: "History" },
  { key: "profile", icon: "☺", label: "Profile" },
];

export default function BottomNav({ active, onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.item,
            active === tab.key && { backgroundColor: colors.surface2 },
          ]}
          onPress={() => onNavigate(tab.key)}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: active === tab.key }}
        >
          <Text
            style={[
              styles.icon,
              { color: active === tab.key ? colors.purpleLight : colors.textMuted },
            ]}
          >
            {tab.icon}
          </Text>
          <Text
            style={[
              styles.label,
              {
                color: active === tab.key ? colors.purpleLight : colors.textMuted,
                fontWeight: active === tab.key ? "700" : "500",
              },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    maxWidth: 560,
    height: 70,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    alignSelf: "center",
  },
  item: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: { fontSize: 18, lineHeight: 22 },
  label: { fontSize: 10 },
});
