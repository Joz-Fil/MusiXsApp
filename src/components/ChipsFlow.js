import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SPRING, USE_NATIVE_DRIVER } from "./anim";

let nextChipId = 1;

// A flow of chips that spring in when an item is added and shrink out when
// one is removed. `keyOf` must return a stable unique key per item (pass
// `(item, i) => i` for append-only object lists).
export default function ChipsFlow({ items, keyOf, renderItem, gap = 8, style }) {
  const keyOfFn = keyOf || ((item) => String(item));
  const [chips, setChips] = useState([]);

  useEffect(() => {
    setChips((prev) => {
      const keys = items.map((item, i) => keyOfFn(item, i));
      let changed = false;
      const next = [];
      for (const chip of prev) {
        if (chip.leaving) {
          next.push(chip);
          continue;
        }
        if (keys.includes(chip.itemKey)) {
          next.push(chip);
        } else {
          next.push({ ...chip, leaving: true });
          changed = true;
        }
      }
      for (let i = 0; i < items.length; i++) {
        const itemKey = keyOfFn(items[i], i);
        if (!prev.some((c) => !c.leaving && c.itemKey === itemKey)) {
          next.push({
            id: nextChipId++,
            itemKey,
            item: items[i],
            value: new Animated.Value(0),
            leaving: false,
            started: false,
          });
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    for (const chip of chips) {
      if (chip.started) continue;
      chip.started = true;
      if (chip.leaving) {
        Animated.timing(chip.value, { toValue: 0, duration: 160, useNativeDriver: USE_NATIVE_DRIVER }).start(
          ({ finished }) => {
            if (finished) setChips((prev) => prev.filter((c) => c !== chip));
          }
        );
      } else {
        Animated.spring(chip.value, { ...SPRING.popIn, useNativeDriver: USE_NATIVE_DRIVER }).start();
      }
    }
  }, [chips]);

  return (
    <View style={[styles.flow, { gap }, style]}>
      {chips.map((chip) => (
        <Animated.View
          key={chip.id}
          style={{ opacity: chip.value, transform: [{ scale: chip.value }] }}
        >
          {renderItem(chip.item)}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
});
