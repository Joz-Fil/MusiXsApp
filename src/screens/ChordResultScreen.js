import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import NoteBurst from "../components/NoteBurst";
import { useAudio } from "../audio/AudioContext";

export default function ChordResultScreen({ result, onBuildAnother, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord, playChordSequence, stopChordSequence } = useAudio();
  const [playingIndex, setPlayingIndex] = useState(-1); // chord currently sounding
  const aliveRef = useRef(true);
  // Identifies the playback run so a restarted review cannot clear the state
  // of the run that replaced it.
  const runRef = useRef(0);

  // Multi-chord sessions pass a `chords` array; fall back to the original
  // single-chord shape so older results still render.
  const chords =
    result?.chords && result.chords.length > 0
      ? result.chords
      : result?.chordName
        ? [{ notes: result.notes, chordName: result.chordName }]
        : [];
  const isMulti = chords.length > 1;
  const lastChord = chords[chords.length - 1];
  const playing = playingIndex >= 0;

  // The lofi bed keeps playing on this screen like everywhere else; any chord
  // playback here (single rows, Play All) ducks it to a whisper while it
  // sounds and it fades straight back afterwards. Any progression still
  // playing stops when this instance goes away — instance-scoped, so it can
  // never disturb a playback started elsewhere.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Reviews the progression exactly the way it was performed: chord 1, a 0.5s
  // pause, chord 2, a 0.5s pause, chord 3 ... via the sequencer shared with
  // the Build a Chord workspace. The rows light up as each chord sounds.
  const handlePlayAll = async () => {
    if (chords.length === 0) return;
    const run = (runRef.current += 1);
    setPlayingIndex(0);

    await playChordSequence(chords, {
      onChord: (i) => {
        if (run === runRef.current) setPlayingIndex(i);
      },
      isCancelled: () => !aliveRef.current,
    });

    if (aliveRef.current && run === runRef.current) setPlayingIndex(-1);
  };

  // A single chord tapped from the list supersedes the running progression.
  const handlePlayOne = (notes) => {
    runRef.current += 1;
    stopChordSequence();
    setPlayingIndex(-1);
    playChord(notes);
  };

  // Leaving for the workspace stops the review playback before it navigates.
  const handleBuildAnother = () => {
    runRef.current += 1;
    stopChordSequence();
    setPlayingIndex(-1);
    onBuildAnother();
  };

  // Leaving for another tab stops it too (and the router brings the menu
  // music back when the destination is the main menu).
  const handleNavigate = (key) => {
    runRef.current += 1;
    stopChordSequence();
    setPlayingIndex(-1);
    onNavigate(key);
  };

  return (
    <ScreenWrapper scroll>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {isMulti ? `You built ${chords.length} chords` : "You built a Chord"}
      </Text>

      {isMulti ? (
        <View style={styles.listArea}>
          {chords.map((c, i) => {
            const isSounding = i === playingIndex;
            return (
              <FadeSlide key={i} delay={120 + i * 90} direction="left">
                <TouchButton
                  style={[
                    styles.chordRow,
                    {
                      backgroundColor: isSounding ? colors.purple : colors.glass,
                      borderColor: isSounding ? colors.purple : colors.glassBorder,
                      shadowColor: colors.purple,
                      shadowOpacity: isSounding ? 0.7 : 0,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                  onPress={() => handlePlayOne(c.notes)}
                >
                  <Text
                    style={[
                      styles.chordRowText,
                      { color: isSounding ? "white" : colors.text },
                    ]}
                  >
                    {i + 1}. {c.chordName}
                  </Text>
                  <Text style={[styles.chordRowPlay, { color: isSounding ? "white" : colors.purpleLight }]}>
                    {isSounding ? "♪" : "▶"}
                  </Text>
                </TouchButton>
              </FadeSlide>
            );
          })}
          <NoteBurst trigger={1} fireOnMount count={10} color={colors.purpleLight} rise={150} spread={200} />
        </View>
      ) : (
        <FadeSlide delay={100}>
          <View
            style={[
              styles.resultBox,
              {
                backgroundColor: playing ? colors.purple : colors.glass,
                borderColor: playing ? colors.purple : colors.glassBorder,
                borderWidth: 1,
                shadowColor: colors.purple,
                shadowOpacity: 0.55,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            <Text style={[styles.resultText, { color: playing ? "white" : colors.text }]}>
              {lastChord?.chordName || "—"}
            </Text>
          </View>
        </FadeSlide>
      )}

      <View style={styles.row}>
        <TouchButton
          style={[styles.secondaryButton, { flex: 1, backgroundColor: colors.surface2, opacity: playing ? 0.6 : 1 }]}
          onPress={handleBuildAnother}
        >
          <Text style={[styles.secondaryText, { color: colors.text }]}>Build another</Text>
        </TouchButton>
        <TouchButton
          style={[
            styles.primaryButton,
            {
              flex: 1,
              backgroundColor: colors.purple,
              shadowColor: colors.purple,
              shadowOpacity: 0.7,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
          disabled={chords.length === 0}
          onPress={handlePlayAll}
        >
          <Text style={styles.primaryText}>
            {playing ? "Playing…" : isMulti ? "▶ Play All" : "▶ Play"}
          </Text>
        </TouchButton>
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {isMulti
          ? "Chords play back in order, one after another"
          : "Tap Play to hear the chord again"}
      </Text>

      <BottomNav active="home" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 4, textAlign: "center" },
  resultBox: {
    borderRadius: 18,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  resultText: { fontSize: 22, fontWeight: "800" },
  listArea: { position: "relative", gap: 10, marginBottom: 20 },
  chordRow: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  chordRowText: { fontSize: 15, fontWeight: "600" },
  chordRowPlay: { fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  secondaryButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  secondaryText: { fontWeight: "600", fontSize: 13 },
  primaryButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700" },
  hint: { fontSize: 11, textAlign: "center", marginTop: 10 },
});
