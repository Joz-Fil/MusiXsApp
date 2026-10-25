import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

/**
 * Creative icons for MusiXs core modes:
 * - Build a Chord: harmonic construction blocks stacking upward with connection beam and creation sparkle
 * - Guess the Chord: acoustic soundwaves listening in with mystery target & musical ear note
 * - Learn a Chord: musical theory anatomy slate with interval formula (1·3·5) and illuminated inspection lens
 */

export function BuildChordIcon({ size = 48, colors, style }) {
  const scale = size / 48;
  const isDark = colors?.text === "#ffffff";

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(14 * scale),
          backgroundColor: isDark ? "rgba(139, 124, 246, 0.16)" : "rgba(110, 79, 240, 0.12)",
          borderColor: isDark ? "rgba(180, 156, 238, 0.35)" : "rgba(110, 79, 240, 0.28)",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Build a Chord Icon"
    >
      {/* Harmonic foundation stack: 3 ascending tone pillars */}
      <View style={[styles.buildCanvas, { width: 34 * scale, height: 32 * scale }]}>
        {/* Step 1: Root Note Block (Low) */}
        <View
          style={[
            styles.buildBlock,
            styles.buildBlock1,
            {
              width: 10 * scale,
              height: 12 * scale,
              borderRadius: 3 * scale,
              backgroundColor: isDark ? "rgba(180, 156, 238, 0.6)" : "rgba(110, 79, 240, 0.45)",
            },
          ]}
        >
          <View
            style={[
              styles.buildDot,
              {
                width: 3 * scale,
                height: 3 * scale,
                borderRadius: 2 * scale,
                backgroundColor: "#ffffff",
              },
            ]}
          />
        </View>

        {/* Harmonic Bridge Link */}
        <View
          style={[
            styles.buildBeam,
            {
              height: 2 * scale,
              backgroundColor: colors?.purple || "#8b7cf6",
              transform: [{ rotate: "-28deg" }],
            },
          ]}
        />

        {/* Step 2: Third Note Block (Mid) */}
        <View
          style={[
            styles.buildBlock,
            styles.buildBlock2,
            {
              width: 10 * scale,
              height: 18 * scale,
              borderRadius: 3 * scale,
              backgroundColor: colors?.purple || "#8b7cf6",
            },
          ]}
        >
          <View
            style={[
              styles.buildDot,
              {
                width: 3 * scale,
                height: 3 * scale,
                borderRadius: 2 * scale,
                backgroundColor: "#ffffff",
              },
            ]}
          />
        </View>

        {/* Step 3: Fifth Note Block (Pinnacle) */}
        <View
          style={[
            styles.buildBlock,
            styles.buildBlock3,
            {
              width: 10 * scale,
              height: 24 * scale,
              borderRadius: 3 * scale,
              backgroundColor: isDark ? "#c4b5fd" : "#4b33a8",
            },
          ]}
        >
          <Text
            style={[
              styles.buildNoteSymbol,
              {
                fontSize: 9 * scale,
                color: "#ffffff",
              },
            ]}
          >
            ♪
          </Text>
        </View>

        {/* Plus / Construct Badge Badge */}
        <View
          style={[
            styles.buildBadge,
            {
              top: -2 * scale,
              left: 0,
              width: 11 * scale,
              height: 11 * scale,
              borderRadius: 6 * scale,
              backgroundColor: colors?.purple || "#8b7cf6",
            },
          ]}
        >
          <Text style={[styles.buildPlus, { fontSize: 8 * scale }]}>+</Text>
        </View>
      </View>
    </View>
  );
}

export function GuessChordIcon({ size = 48, colors, style }) {
  const scale = size / 48;
  const isDark = colors?.text === "#ffffff";

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(14 * scale),
          backgroundColor: isDark ? "rgba(139, 124, 246, 0.16)" : "rgba(110, 79, 240, 0.12)",
          borderColor: isDark ? "rgba(180, 156, 238, 0.35)" : "rgba(110, 79, 240, 0.28)",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Guess the Chord Icon"
    >
      <View style={[styles.guessCanvas, { width: 34 * scale, height: 32 * scale }]}>
        {/* Left Acoustic Wave Arc */}
        <View style={styles.guessWaveGroupLeft}>
          <View
            style={[
              styles.guessWaveOuter,
              {
                width: 7 * scale,
                height: 18 * scale,
                borderLeftWidth: 2 * scale,
                borderColor: isDark ? "rgba(180, 156, 238, 0.5)" : "rgba(110, 79, 240, 0.4)",
                borderTopLeftRadius: 10 * scale,
                borderBottomLeftRadius: 10 * scale,
              },
            ]}
          />
          <View
            style={[
              styles.guessWaveInner,
              {
                width: 5 * scale,
                height: 11 * scale,
                borderLeftWidth: 1.8 * scale,
                borderColor: colors?.purple || "#8b7cf6",
                borderTopLeftRadius: 6 * scale,
                borderBottomLeftRadius: 6 * scale,
              },
            ]}
          />
        </View>

        {/* Center Mystery Core with Note & Question Mark */}
        <View
          style={[
            styles.guessCore,
            {
              width: 18 * scale,
              height: 22 * scale,
              borderRadius: 9 * scale,
              backgroundColor: colors?.purple || "#8b7cf6",
            },
          ]}
        >
          <Text
            style={[
              styles.guessQuestionText,
              {
                fontSize: 12 * scale,
                color: "#ffffff",
              },
            ]}
          >
            ?
          </Text>
          <View
            style={[
              styles.guessNotePip,
              {
                width: 3.5 * scale,
                height: 3.5 * scale,
                borderRadius: 2 * scale,
                backgroundColor: isDark ? "#c4b5fd" : "#ede9fb",
              },
            ]}
          />
        </View>

        {/* Right Acoustic Wave Arc */}
        <View style={styles.guessWaveGroupRight}>
          <View
            style={[
              styles.guessWaveInner,
              {
                width: 5 * scale,
                height: 11 * scale,
                borderRightWidth: 1.8 * scale,
                borderColor: colors?.purple || "#8b7cf6",
                borderTopRightRadius: 6 * scale,
                borderBottomRightRadius: 6 * scale,
              },
            ]}
          />
          <View
            style={[
              styles.guessWaveOuter,
              {
                width: 7 * scale,
                height: 18 * scale,
                borderRightWidth: 2 * scale,
                borderColor: isDark ? "rgba(180, 156, 238, 0.5)" : "rgba(110, 79, 240, 0.4)",
                borderTopRightRadius: 10 * scale,
                borderBottomRightRadius: 10 * scale,
              },
            ]}
          />
        </View>

        {/* Sound Sparkle Accent */}
        <Text
          style={[
            styles.guessSparkle,
            {
              top: -3 * scale,
              right: -1 * scale,
              fontSize: 9 * scale,
              color: colors?.purpleLight || "#b49cee",
            },
          ]}
        >
          ♪
        </Text>
      </View>
    </View>
  );
}

export function LearnChordIcon({ size = 48, colors, style }) {
  const scale = size / 48;
  const isDark = colors?.text === "#ffffff";

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(14 * scale),
          backgroundColor: isDark ? "rgba(139, 124, 246, 0.16)" : "rgba(110, 79, 240, 0.12)",
          borderColor: isDark ? "rgba(180, 156, 238, 0.35)" : "rgba(110, 79, 240, 0.28)",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Learn a Chord Icon"
    >
      <View style={[styles.learnCanvas, { width: 34 * scale, height: 32 * scale }]}>
        {/* Theory Card / Slate backdrop */}
        <View
          style={[
            styles.learnSlate,
            {
              width: 28 * scale,
              height: 22 * scale,
              borderRadius: 6 * scale,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(110, 79, 240, 0.14)",
              borderColor: colors?.purple || "#8b7cf6",
              borderWidth: 1.5 * scale,
            },
          ]}
        >
          {/* Staff Lines */}
          <View
            style={[
              styles.learnStaffLine,
              {
                top: 5 * scale,
                height: 1 * scale,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(110, 79, 240, 0.25)",
              },
            ]}
          />
          <View
            style={[
              styles.learnStaffLine,
              {
                top: 10 * scale,
                height: 1 * scale,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(110, 79, 240, 0.25)",
              },
            ]}
          />

          {/* Individual chord tone beads (1, 3, 5 formula) */}
          <View style={styles.learnBeadsRow}>
            <View
              style={[
                styles.learnBead,
                {
                  width: 5 * scale,
                  height: 5 * scale,
                  borderRadius: 3 * scale,
                  backgroundColor: colors?.purple || "#8b7cf6",
                },
              ]}
            />
            <View
              style={[
                styles.learnBead,
                {
                  width: 5 * scale,
                  height: 5 * scale,
                  borderRadius: 3 * scale,
                  backgroundColor: isDark ? "#c4b5fd" : "#6e4ff0",
                  transform: [{ translateY: -3 * scale }],
                },
              ]}
            />
            <View
              style={[
                styles.learnBead,
                {
                  width: 5 * scale,
                  height: 5 * scale,
                  borderRadius: 3 * scale,
                  backgroundColor: colors?.green || "#2e7d32",
                  transform: [{ translateY: -6 * scale }],
                },
              ]}
            />
          </View>
        </View>

        {/* Magnifying / Exploration Lens Badge */}
        <View
          style={[
            styles.learnLens,
            {
              bottom: 0,
              right: 0,
              width: 14 * scale,
              height: 14 * scale,
              borderRadius: 7 * scale,
              backgroundColor: colors?.purple || "#8b7cf6",
              borderWidth: 1.5 * scale,
              borderColor: "#ffffff",
            },
          ]}
        >
          <Text style={[styles.learnLensSymbol, { fontSize: 8 * scale }]}>✦</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Universal selector for chord mode icons
 */
export function JourneyIcon({ size = 48, colors, style }) {
  const scale = size / 48;
  const isDark = colors?.text === "#ffffff";

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(14 * scale),
          backgroundColor: isDark ? "rgba(139, 124, 246, 0.16)" : "rgba(110, 79, 240, 0.12)",
          borderColor: isDark ? "rgba(180, 156, 238, 0.35)" : "rgba(110, 79, 240, 0.28)",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="The Journey Icon"
    >
      <Text style={{ fontSize: 22 * scale }}>🗺️</Text>
    </View>
  );
}

export function SoundDojoIcon({ size = 48, colors, style }) {
  const scale = size / 48;
  const isDark = colors?.text === "#ffffff";

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(14 * scale),
          backgroundColor: isDark ? "rgba(139, 124, 246, 0.16)" : "rgba(110, 79, 240, 0.12)",
          borderColor: isDark ? "rgba(180, 156, 238, 0.35)" : "rgba(110, 79, 240, 0.28)",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Sound Dojo Icon"
    >
      <Text style={{ fontSize: 22 * scale }}>🥋</Text>
    </View>
  );
}

export default function ChordModeIcon({ mode, size = 48, colors, style }) {
  switch (mode) {

    case "journey":
      return <JourneyIcon size={size} colors={colors} style={style} />;
    case "dojo":
      return <SoundDojoIcon size={size} colors={colors} style={style} />;

    case "build":
      return <BuildChordIcon size={size} colors={colors} style={style} />;
    case "guess":
      return <GuessChordIcon size={size} colors={colors} style={style} />;
    case "learn":
      return <LearnChordIcon size={size} colors={colors} style={style} />;
    default:
      return <BuildChordIcon size={size} colors={colors} style={style} />;
  }
}

const styles = StyleSheet.create({
  iconContainer: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Build a Chord styles
  buildCanvas: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  buildBlock: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  buildBlock1: {
    zIndex: 1,
  },
  buildBlock2: {
    zIndex: 2,
  },
  buildBlock3: {
    zIndex: 3,
  },
  buildDot: {
    opacity: 0.9,
  },
  buildBeam: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 12,
    opacity: 0.45,
  },
  buildNoteSymbol: {
    fontWeight: "900",
    marginTop: -1,
  },
  buildBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  buildPlus: {
    color: "#ffffff",
    fontWeight: "900",
    marginTop: -1,
  },

  // Guess the Chord styles
  guessCanvas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  guessWaveGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 2,
  },
  guessWaveGroupRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 2,
  },
  guessWaveOuter: {
    justifyContent: "center",
  },
  guessWaveInner: {
    justifyContent: "center",
    marginHorizontal: 1,
  },
  guessCore: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
    position: "relative",
  },
  guessQuestionText: {
    fontWeight: "900",
    textAlign: "center",
  },
  guessNotePip: {
    position: "absolute",
    bottom: 2,
  },
  guessSparkle: {
    position: "absolute",
    fontWeight: "900",
  },

  // Learn a Chord styles
  learnCanvas: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  learnSlate: {
    position: "relative",
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: "flex-end",
  },
  learnStaffLine: {
    position: "absolute",
    left: 3,
    right: 3,
  },
  learnBeadsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 3,
    paddingBottom: 2,
  },
  learnBead: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  learnLens: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  learnLensSymbol: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
