import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import NoteGrid from "../components/NoteGrid";
import NoteBurst from "../components/NoteBurst";
import ChipsFlow from "../components/ChipsFlow";
import { identifyChord } from "../utils/musicTheory";
import { useAudio } from "../audio/AudioContext";

// How many chords one build session covers; 1 keeps the original flow.
const COUNT_OPTIONS = [1, 2, 3, 4, 5];

export default function BuildChordScreen({ onBack, onBuilt, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord, playChordSequence, stopChordSequence } = useAudio();
  const [count, setCount] = useState(1);
  const [builtChords, setBuiltChords] = useState([]); // { notes, chordName } per finished build
  const [selected, setSelected] = useState([]);
  const [phase, setPhase] = useState("setup"); // "setup" | "building" | "playing"
  const [playingIndex, setPlayingIndex] = useState(-1); // chord currently sounding
  const aliveRef = useRef(true);
  // Set while the closing progression plays, so a double tap on Enter cannot
  // start a second performance of the same session.
  const busyRef = useRef(false);

  // The playback stops the moment this screen goes away (instance-scoped, so
  // it can never touch a progression another screen has started), and every
  // deliberate exit also cuts off the chord still sounding.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const handleStart = () => {
    setBuiltChords([]);
    setSelected([]);
    setPhase("building");
  };

  // The session is configured the moment the chord count is picked. The menu
  // music keeps playing — the chord samples (and the closing progression)
  // duck it while they sound.
  const handleChooseCount = (n) => {
    setCount(n);
  };

  const leave = (go) => {
    stopChordSequence();
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));

  const toggleNote = (note) => {
    if (phase !== "building") return;
    setSelected((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleEnter = async () => {
    if (busyRef.current || phase !== "building" || selected.length < 2) return;
    const chord = { notes: [...selected], chordName: identifyChord(selected) };
    const allChords = [...builtChords, chord];
    if (allChords.length < count) {
      setBuiltChords(allChords);
      setSelected([]);
      return;
    }

    // Session complete: perform the whole progression back in order — each
    // chord, then a 0.5s pause, then the next (the shared sequencer in
    // src/audio/chordSequence.js) — and only then hand it to the result
    // screen. Awaiting the sequence keeps the chords strictly linear while
    // the UI keeps rendering the chip that is currently sounding.
    busyRef.current = true;
    setSelected([]);
    setBuiltChords(allChords);
    setPlayingIndex(0);
    setPhase("playing");

    const completed = await playChordSequence(allChords, {
      onChord: setPlayingIndex,
      isCancelled: () => !aliveRef.current,
    });

    busyRef.current = false;
    setPlayingIndex(-1);
    if (!aliveRef.current) return;
    if (!completed) {
      // Cancelled (the player left): stay put rather than navigating on.
      setPhase("building");
      return;
    }
    // Keeping the single-chord fields so the original result display still
    // works for count = 1.
    onBuilt({ chords: allChords, ...chord });
  };

  if (phase === "setup") {
    return (
      <ScreenWrapper scroll>
        <TouchButton style={styles.backBtnHit} onPress={handleBack} accessibilityLabel="Back to home">
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchButton>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build a Chord</Text>

        <FadeSlide delay={80}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>How many chords?</Text>
        </FadeSlide>
        <View style={styles.row}>
          {COUNT_OPTIONS.map((n, i) => (
            <FadeSlide key={n} delay={140 + i * 60} style={styles.fadeFlex}>
              <TouchButton
                style={[
                  styles.countChip,
                  {
                    backgroundColor: count === n ? colors.purple : colors.glass,
                    borderColor: colors.glassBorder,
                    borderWidth: 1,
                    shadowColor: colors.purple,
                    shadowOpacity: count === n ? 0.7 : 0,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
                pulseKey={count === n ? `count-${n}` : undefined}
                onPress={() => handleChooseCount(n)}
              >
                <Text style={styles.countText}>{n}</Text>
              </TouchButton>
            </FadeSlide>
          ))}
        </View>
        <FadeSlide key={`hint-${count}`} delay={60} distance={8}>
          <Text style={[styles.countHint, { color: colors.textMuted }]}>
            You will build {count} chord{count > 1 ? "s" : ""} in a row
          </Text>
        </FadeSlide>

        <FadeSlide delay={420}>
          <TouchButton
            style={[
              styles.enterButton,
              {
                backgroundColor: colors.purple,
                shadowColor: colors.purple,
                shadowOpacity: 0.7,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
            onPress={handleStart}
          >
            <Text style={styles.enterText}>Start Building</Text>
          </TouchButton>
        </FadeSlide>

        <BottomNav active="home" onNavigate={handleNavigate} />
      </ScreenWrapper>
    );
  }

  // While the finished progression is being performed, the workspace is
  // read-only: the chips light up in time with the audio instead of the player
  // tapping further notes on top of it.
  const playing = phase === "playing";

  return (
    <ScreenWrapper scroll>
      <TouchButton style={styles.backBtnHit} onPress={handleBack} accessibilityLabel="Back to home">
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchButton>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build a Chord</Text>

      <View style={styles.progressArea}>
        <FadeSlide key={`progress-${builtChords.length}`} delay={40} distance={8}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: playing ? colors.purpleLight : colors.textMuted }]}>
              {playing
                ? `▶ Playing back ${playingIndex + 1} of ${count}`
                : `Chord ${builtChords.length + 1} of ${count}`}
            </Text>
            {!playing && (
              <TouchButton style={styles.changeHit} onPress={() => setPhase("setup")}>
                <Text style={[styles.changeLink, { color: colors.purpleLight }]}>Change count</Text>
              </TouchButton>
            )}
          </View>
        </FadeSlide>
        <NoteBurst trigger={builtChords.length} count={7} color={colors.purpleLight} rise={90} spread={150} />
      </View>

      {builtChords.length > 0 && (
        <ChipsFlow
          items={builtChords}
          keyOf={(c, i) => i}
          style={styles.builtList}
          renderItem={(c) => {
            // ChipsFlow renders items without an index, so the sounding chord
            // is matched by identity against the played progression.
            const isSounding = builtChords.indexOf(c) === playingIndex;
            return (
              <View
                style={[
                  styles.builtChip,
                  {
                    backgroundColor: isSounding ? colors.purple : colors.glass,
                    borderColor: isSounding ? colors.purple : colors.glassBorder,
                    shadowColor: colors.purple,
                    shadowOpacity: isSounding ? 0.8 : 0,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <Text style={[styles.builtChipText, { color: isSounding ? "white" : colors.green }]}>
                  {isSounding ? "▶" : "✓"} {c.chordName}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.selectedBar, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        {selected.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {playing ? "Playing your chords…" : "Tap notes below"}
          </Text>
        ) : (
          <ChipsFlow
            items={selected}
            gap={8}
            renderItem={(n) => (
              <View style={[styles.selectedDot, { backgroundColor: colors.purple }]}>
                <Text style={styles.selectedDotText}>{n}</Text>
              </View>
            )}
          />
        )}
      </View>

      <NoteGrid selected={selected} onToggle={toggleNote} colors={colors} disabled={playing} />

      <View style={styles.row}>
        <TouchButton
          style={[styles.actionButton, { flex: 1, backgroundColor: colors.surface2, opacity: playing ? 0.5 : 1 }]}
          disabled={playing}
          onPress={() => setSelected([])}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>← Clear</Text>
        </TouchButton>
        <TouchButton
          style={[
            styles.actionButton,
            { flex: 1, backgroundColor: colors.surface2, opacity: selected.length && !playing ? 1 : 0.5 },
          ]}
          disabled={selected.length === 0 || playing}
          onPress={() => playChord(selected)}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Play</Text>
        </TouchButton>
      </View>

      <TouchButton
        style={[
          styles.enterButton,
          {
            backgroundColor: colors.purple,
            opacity: selected.length >= 2 && !playing ? 1 : 0.5,
            shadowColor: colors.purple,
            shadowOpacity: selected.length >= 2 && !playing ? 0.7 : 0,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
        disabled={selected.length < 2 || playing}
        pulseKey={selected.length >= 2 && !playing ? "valid" : undefined}
        onPress={handleEnter}
      >
        <Text style={styles.enterText}>
          {builtChords.length + 1 < count ? "Next Chord" : "Enter"}
        </Text>
      </TouchButton>

      <BottomNav active="home" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  backBtnHit: { alignSelf: "flex-start", padding: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 12, marginTop: 4 },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  fadeFlex: { flex: 1 },
  countChip: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "white", fontSize: 18, fontWeight: "800" },
  countHint: { fontSize: 12, marginBottom: 8, textAlign: "center" },
  progressArea: { position: "relative" },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 13, fontWeight: "600" },
  changeHit: { paddingVertical: 4, paddingHorizontal: 6 },
  changeLink: { fontSize: 12, fontWeight: "600" },
  builtList: { marginBottom: 10 },
  builtChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  builtChipText: { fontSize: 11, fontWeight: "700" },
  selectedBar: {
    borderRadius: 14,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    padding: 8,
    borderWidth: 1,
  },
  selectedDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b7cf6",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  selectedDotText: { color: "white", fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  actionText: { fontWeight: "600" },
  enterButton: { borderRadius: 12, padding: 12, alignItems: "center", marginTop: 2 },
  enterText: { color: "white", fontWeight: "700" },
});
