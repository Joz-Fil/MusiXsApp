import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import { useAudio } from "../audio/AudioContext";
import { getChordHistory, clearChordHistory } from "../db/historyDatabaseService";

const PAGE_SIZE = 50;

// SQLite CURRENT_TIMESTAMP is UTC with one-second resolution; Safari only
// parses the ISO form, so normalize before handing it to Date.
function formatTimestamp(raw) {
  if (typeof raw !== "string" || !raw) return "";
  const date = new Date(`${raw.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDetails(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

export default function HistoryScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (nextOffset) => {
      try {
        const page = await getChordHistory(PAGE_SIZE, nextOffset);
        if (!aliveRef.current) return;
        setRecords((prev) => (nextOffset === 0 ? page : [...prev, ...page]));
        setHasMore(page.length === PAGE_SIZE);
        setStatus("ready");
      } catch (error) {
        console.warn("History load failed:", error);
        if (aliveRef.current) setStatus("error");
      }
    },
    []
  );

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const handleLoadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    loadPage(nextOffset);
  };

  const handleClear = async () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setConfirmingClear(false);
    try {
      await clearChordHistory();
      if (!aliveRef.current) return;
      setRecords([]);
      setOffset(0);
      setHasMore(false);
    } catch (error) {
      console.warn("History clear failed:", error);
      if (aliveRef.current) setStatus("error");
    }
  };

  const handlePlayRow = (notes) => {
    if (Array.isArray(notes) && notes.length > 0) playChord(notes);
  };

  return (
    <ScreenWrapper scroll>
      <TouchButton style={styles.backHit} onPress={onBack} accessibilityLabel="Back to home">
        <Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
      </TouchButton>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>History</Text>

      {status === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} />
        </View>
      )}

      {status === "error" && (
        <View style={[styles.panel, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text style={[styles.emptyText, { color: colors.red }]}>
            Could not load your chord history.
          </Text>
          <TouchButton
            style={[styles.retryButton, { borderColor: colors.purple }]}
            onPress={() => {
              setOffset(0);
              setStatus("loading");
              loadPage(0);
            }}
          >
            <Text style={[styles.retryText, { color: colors.purpleLight }]}>Try again</Text>
          </TouchButton>
        </View>
      )}

      {status === "ready" && records.length === 0 && (
        <View style={[styles.panel, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text style={[styles.emptyMark, { color: colors.purpleLight }]}>♩</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No chord activity yet.{"\n"}
            Build or guess a chord and it will show up here.
          </Text>
        </View>
      )}

      {status === "ready" && records.length > 0 && (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.countText, { color: colors.textMuted }]}>
              {records.length} attempt{records.length === 1 ? "" : "s"} logged
            </Text>
            <TouchButton style={styles.clearHit} onPress={handleClear}>
              <Text
                style={[
                  styles.clearText,
                  { color: confirmingClear ? colors.red : colors.purpleLight },
                ]}
              >
                {confirmingClear ? "Tap again to delete everything" : "Clear history"}
              </Text>
            </TouchButton>
          </View>

          {records.map((record, i) => {
            const details = parseDetails(record.attemptsDetails);
            const notes = Array.isArray(details?.notes) ? details.notes : null;
            return (
              <FadeSlide key={record.id} delay={Math.min(i, 8) * 60} direction="left">
                <TouchButton
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.glass,
                      borderColor: record.isSuccess ? colors.glassBorder : colors.redBg,
                    },
                  ]}
                  disabled={!notes}
                  onPress={() => handlePlayRow(notes)}
                  accessibilityLabel={`${record.activityType} ${record.chordName}, ${record.isSuccess ? "success" : "failed"}`}
                >
                  <View style={styles.rowMain}>
                    <View style={styles.rowTitleLine}>
                      <Text
                        style={[
                          styles.rowType,
                          { color: record.activityType === "BUILD_CHORD" ? colors.purpleLight : colors.textMuted },
                        ]}
                      >
                        {record.activityType === "BUILD_CHORD" ? "BUILD" : "GUESS"}
                      </Text>
                      <Text style={[styles.rowName, { color: colors.text }]}>{record.chordName}</Text>
                    </View>
                    <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                      {formatTimestamp(record.createdAt)}
                      {notes ? `  ·  ${notes.join(" · ")}` : ""}
                    </Text>
                  </View>
                  <View style={styles.rowSide}>
                    {notes && <Text style={[styles.rowPlay, { color: colors.purpleLight }]}>▶</Text>}
                    <Text
                      style={[styles.rowResult, { color: record.isSuccess ? colors.green : colors.red }]}
                    >
                      {record.isSuccess ? "✓" : "✗"}
                    </Text>
                  </View>
                </TouchButton>
              </FadeSlide>
            );
          })}

          {hasMore && (
            <TouchButton
              style={[styles.moreButton, { borderColor: colors.purple }]}
              onPress={handleLoadMore}
            >
              <Text style={[styles.moreText, { color: colors.purpleLight }]}>Load more</Text>
            </TouchButton>
          )}
        </>
      )}

      <BottomNav active="history" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backHit: { alignSelf: "flex-start", padding: 4 },
  back: { fontSize: 18, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 4, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  emptyMark: { fontSize: 30, marginBottom: 10 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  retryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: { fontSize: 13, fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  countText: { fontSize: 12, fontWeight: "600" },
  clearHit: { paddingVertical: 4, paddingHorizontal: 6 },
  clearText: { fontSize: 12, fontWeight: "700" },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowMain: { flex: 1, marginRight: 10 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  rowType: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  rowName: { fontSize: 15, fontWeight: "700" },
  rowMeta: { fontSize: 11 },
  rowSide: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowPlay: { fontSize: 13, fontWeight: "700" },
  rowResult: { fontSize: 16, fontWeight: "800" },
  moreButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  moreText: { fontSize: 13, fontWeight: "700" },
});
