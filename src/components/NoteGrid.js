import { useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import TouchButton from "./TouchButton";
import AccidentalPicker from "./AccidentalPicker";
import { USE_NATIVE_DRIVER } from "./anim";

const GRID = [
  ["A", "B", "C", "D"],
  ["E", "F", "G"],
];

// The shared A–G note keyboard: keys dip on press (TouchButton) and flash violet
// when tapped. Selected notes show in the panel above, not on the keys themselves.
// Long press a note to select sharp/flat variants.
export default function NoteGrid({ selected, onToggle, colors, disabled }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerNote, setPickerNote] = useState(null);

  const handleLongPress = (note) => {
    if (disabled) return;
    setPickerNote(note);
    setPickerVisible(true);
  };

  const handlePickerSelect = (noteWithAccidental) => {
    onToggle(noteWithAccidental);
  };

  const handleNotePress = (note) => {
    // Normal tap only toggles the natural note (not sharp or flat)
    onToggle(note);
  };

  return (
    <View>
      {GRID.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((note) => {
            return (
              <NoteKey
                key={note}
                note={note}
                colors={colors}
                onPress={handleNotePress}
                onLongPress={handleLongPress}
                disabled={disabled}
              />
            );
          })}
        </View>
      ))}

      <AccidentalPicker
        visible={pickerVisible}
        note={pickerNote}
        colors={colors}
        onSelect={handlePickerSelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

function NoteKey({ note, colors, onPress, onLongPress, disabled }) {
  const longPressTimer = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    // Start flash animation
    Animated.timing(flashAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    // Setup long press timer
    if (onLongPress && !disabled) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(note);
      }, 500);
    }
  };

  const handlePressOut = () => {
    // End flash animation
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePress = () => {
    handlePressOut();
    onPress(note);
  };

  return (
    <TouchButton
      style={[
        styles.key,
        {
          backgroundColor: colors.surface2,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
      pressScale={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={`Note ${note}`}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint="Long press for sharp or flat"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.keyGlow,
          {
            backgroundColor: colors.purple,
            opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
            transform: [{ scale: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          },
        ]}
      />
      <Text style={[styles.keyText, { color: colors.text }]}>{note}</Text>
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
  keyText: { fontSize: 14, fontWeight: "700" },
});
