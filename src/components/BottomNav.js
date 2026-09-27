import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";

const TABS = [
  { key: "settings", icon: "⚙" },
  { key: "home", icon: "⌂" },
  { key: "history", icon: "▤" },
  { key: "profile", icon: "☺" },
];

export default function BottomNav({ active, onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.surface }]}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.item}
          onPress={() => onNavigate(tab.key)}
        >
          <Text
            style={[
              styles.icon,
              { color: active === tab.key ? colors.purpleLight : colors.textMuted },
            ]}
          >
            {tab.icon}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  item: { paddingHorizontal: 14, paddingVertical: 8 },
  icon: { fontSize: 20 },
});
