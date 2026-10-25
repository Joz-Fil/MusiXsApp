import { useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";
import AccidentalPicker from "./AccidentalPicker";
import { USE_NATIVE_DRIVER } from "./anim";

const GRID = [
  ["A", "B", "C", "D"],
  ["E", "F", "G"],
];

// The shared A–G note keyboard: keys dip on press (TouchButton) and flash violet
// when tapped. Selected notes show in the panel above and on keys.
// Long press a note to select sharp/flat variants.
// Can highlight suggested companion notes when Smart Guide is active.
export default function NoteGrid({
  selected = [],
  suggestedNotes = [],
  onToggle,
  colors: propColors,
  disabled,
}) {
  const theme = useAppTheme();
  const colors = propColors || theme.colors;
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
            const isSelected = selected && selected.some((s) => s.startsWith(note));
            const isSuggested = suggestedNotes && suggestedNotes.some((s) => s.startsWith(note));
            return (
              <NoteKey
                key={note}
                note={note}
                colors={colors}
                isSelected={isSelected}
                isSuggested={isSuggested}
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

function NoteKey({ note, colors, isSelected, isSuggested, onPress, onLongPress, disabled }) {
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
          backgroundColor: isSelected ? colors.surface : colors.surface2,
          borderColor: isSelected
            ? colors.purple
            : isSuggested
            ? colors.purpleLight
            : colors.border,
          borderWidth: isSelected || isSuggested ? 1.5 : 1,
        },
        isSuggested && {
          shadowColor: colors.purple,
          shadowOpacity: 0.45,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 0,
        },
      ]}
      pressScale={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={`Note ${note}`}
      accessibilityState={{ disabled: !!disabled, selected: !!isSelected }}
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
      {isSuggested && !isSelected && (
        <View style={[styles.suggestDot, { backgroundColor: colors.purpleLight }]}>
          <Text style={styles.suggestIcon}>✦</Text>
        </View>
      )}
      <Text
        style={[
          styles.keyText,
          { color: isSelected ? colors.purpleLight : colors.text },
          isSelected && { fontWeight: "800" },
        ]}
      >
        {note}
      </Text>
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
  suggestDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestIcon: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "900",
  },
  keyText: { fontSize: 14, fontWeight: "700" },
});
