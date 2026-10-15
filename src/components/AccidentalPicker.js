import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, View, TouchableWithoutFeedback } from "react-native";
import TouchButton from "./TouchButton";
import { USE_NATIVE_DRIVER } from "./anim";

// Modal picker that appears when long-pressing a note to select sharp/flat variants
export default function AccidentalPicker({ visible, note, colors, onSelect, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible || !note) return null;

  const variants = [
    { label: `${note}♭`, value: `${note}♭`, description: "Flat" },
    { label: note, value: note, description: "Natural" },
    { label: `${note}#`, value: `${note}#`, description: "Sharp" },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.picker,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.textMuted }]}>
              Select Accidental
            </Text>
            <View style={styles.variantsRow}>
              {variants.map((variant) => (
                <TouchButton
                  key={variant.value}
                  style={[
                    styles.variantButton,
                    { backgroundColor: colors.surface2, borderColor: colors.border },
                  ]}
                  pressScale={0.92}
                  onPress={() => {
                    onSelect(variant.value);
                    onClose();
                  }}
                >
                  <Text style={[styles.variantLabel, { color: colors.text }]}>
                    {variant.label}
                  </Text>
                  <Text style={[styles.variantDesc, { color: colors.textMuted }]}>
                    {variant.description}
                  </Text>
                </TouchButton>
              ))}
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    minWidth: 280,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
  },
  variantsRow: {
    flexDirection: "row",
    gap: 12,
  },
  variantButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  variantLabel: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  variantDesc: {
    fontSize: 10,
    fontWeight: "600",
  },
});
