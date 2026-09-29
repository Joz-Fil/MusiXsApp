import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import TouchButton from "./TouchButton";
import { SPRING, USE_NATIVE_DRIVER } from "./anim";

const GRID = [
  ["A", "B", "C", "D"],
  ["E", "F", "G"],
];

// The shared A–G note keyboard: keys dip on press (TouchButton) and light up
// with a springy neon glow while selected. Set `disabled` to make the whole
// keyboard read-only (e.g. while a built progression is playing back).
export default function NoteGrid({ selected, onToggle, colors, disabled }) {
  return (
    <View>
      {GRID.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((note) => (
            <NoteKey
              key={note}
              note={note}
              selected={selected.includes(note)}
              colors={colors}
              onPress={onToggle}
              disabled={disabled}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function NoteKey({ note, selected, colors, onPress, disabled }) {
  const glow = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(glow, { ...SPRING.select, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [selected, glow]);

  return (
    <TouchButton
      style={[
        styles.key,
        { backgroundColor: selected ? colors.purple : colors.surface2 },
        selected && {
          shadowColor: colors.purple,
          shadowOpacity: 0.85,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
      ]}
      pressScale={0.9}
      onPress={() => onPress(note)}
      disabled={disabled}
      accessibilityLabel={`Note ${note}`}
      accessibilityState={{ selected, disabled: !!disabled }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.keyGlow,
          {
            backgroundColor: colors.purpleLight,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
            // capped at the key's own bounds so a lit key can never paint
            // over its neighbours — the shadow carries the outer bloom
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
          },
        ]}
      />
      <Text style={styles.keyText}>{note}</Text>
    </TouchButton>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  key: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  keyGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  keyText: { color: "white", fontSize: 14, fontWeight: "700" },
});
