import React from "react";
import { Modal, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";

export default function BeginnerPromptModal({
  visible,
  onChooseBeginner,
  onChooseExperienced,
}) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onChooseExperienced}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header Row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={styles.headerTag}>
              <Text style={[styles.kicker, { color: colors.purpleLight }]}>
                WELCOME TO MUSIXS 🎵
              </Text>
            </View>
            <TouchableOpacity onPress={onChooseExperienced} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Close">
              <Text style={{ fontSize: 16, color: colors.textMuted, fontWeight: "700" }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title & Philosophy */}
          <Text style={[styles.title, { color: colors.text }]}>
            Are you a beginner to learning chords?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            MusiXs helps you understand music theory by touch, color, and sound—no boring sheet music or dry memorization required.
          </Text>

          {/* Options */}
          <View style={styles.optionsCol}>
            {/* Beginner Option */}
            <TouchButton
              style={[
                styles.optionCard,
                styles.primaryOption,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.purpleLight,
                  shadowColor: colors.purple,
                },
              ]}
              pressScale={0.96}
              onPress={onChooseBeginner}
              accessibilityRole="button"
              accessibilityLabel="Yes, I am a beginner. Start interactive tutorial"
            >
              <View style={styles.optionTopRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.purple },
                  ]}
                >
                  <Text style={styles.iconEmoji}>🎓</Text>
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Yes, I'm a beginner
                    </Text>
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: colors.purple },
                      ]}
                    >
                      <Text style={styles.badgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                    Take me through the 60-second interactive sound walkthrough and app tour (+100 XP).
                  </Text>
                </View>
              </View>
            </TouchButton>

            {/* Experienced Option */}
            <TouchButton
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
              pressScale={0.96}
              onPress={onChooseExperienced}
              accessibilityRole="button"
              accessibilityLabel="No, I already know chords. Skip directly to the app"
            >
              <View style={styles.optionTopRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <Text style={styles.iconEmoji}>⚡</Text>
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    No, I already know chords
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                    Skip straight to the chord sandbox builder, sound dojo, and chord library.
                  </Text>
                </View>
              </View>
            </TouchButton>
          </View>

          {/* Footer reassurance */}
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            You can always replay the interactive guide anytime from the top bar.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerTag: {
    alignSelf: "flex-start",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  optionsCol: {
    gap: 12,
    marginTop: 6,
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  primaryOption: {
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0,
  },
  optionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
});
