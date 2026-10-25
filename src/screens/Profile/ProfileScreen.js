import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAppTheme } from "../../theme";
import { isSupabaseConfigured } from "../../services/supabase";
import { updateUserAccount } from "../../services/authService";
import {
  getProfileDraftSession,
  updateProfileDraftSession,
  resetProfileDraftSession,
} from "../../services/sessionStore";
import {
  getUserStats,
  getBadges,
  getLevelProgress,
  getGraduationProgress,
  UserStats,
  BadgeDefinition,
} from "../../services/learningService";

const AVATAR_OPTIONS = ["🎵", "🎸", "🎹", "🎧", "🎼", "🎷", "🎤", "⚡", "🌟", "🥁"];

export default function ProfileScreen({ user, onUserUpdate, onLogout, onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const savedDraft = getProfileDraftSession();
  const [currentUser, setCurrentUser] = useState(user);
  const [editModalVisible, setEditModalVisible] = useState(savedDraft.editModalVisible);
  const [selectedAvatar, setSelectedAvatar] = useState(savedDraft.selectedAvatar || currentUser.avatar || "🎵");
  const [displayNameInput, setDisplayNameInput] = useState(
    savedDraft.displayNameInput !== null
      ? savedDraft.displayNameInput
      : (currentUser.displayName || currentUser.username || "")
  );
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(savedDraft.selectedBadge);

  const leave = (go) => {
    updateProfileDraftSession({
      editModalVisible,
      selectedAvatar,
      displayNameInput,
      selectedBadge,
    });
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));
  const [journeyProgress, setJourneyProgress] = useState({});

  const isCloud = currentUser?.isCloud ?? isSupabaseConfigured();

  useEffect(() => {
    getUserStats().then(setStats).catch(() => {});
    getBadges().then(setBadges).catch(() => {});
    getLevelProgress().then(setJourneyProgress).catch(() => {});
  }, []);

  const gradProgress = getGraduationProgress(stats || {}, journeyProgress);

  const openEditModal = () => {
    const av = selectedAvatar || currentUser.avatar || "🎵";
    const dn = displayNameInput || currentUser.displayName || currentUser.username || "";
    setSelectedAvatar(av);
    setDisplayNameInput(dn);
    setEditError("");
    setEditModalVisible(true);
    updateProfileDraftSession({ editModalVisible: true, selectedAvatar: av, displayNameInput: dn });
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    resetProfileDraftSession();
  };

  const saveProfile = async () => {
    const cleanName = displayNameInput.trim();
    if (!cleanName) {
      setEditError("Display name cannot be empty.");
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      const updated = await updateUserAccount(currentUser.id, {
        displayName: cleanName,
        avatar: selectedAvatar,
      });
      setCurrentUser(updated);
      if (onUserUpdate) onUserUpdate(updated);
      resetProfileDraftSession();
      setEditModalVisible(false);
    } catch (err) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <TouchableOpacity onPress={handleBack} accessibilityRole="button" accessibilityLabel="Back to home">
        <Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: colors.text }]}>My Profile</Text>

        {/* Avatar with Edit Badge */}
        <TouchableOpacity
          style={[styles.avatarWrap, { borderColor: colors.border }]}
          onPress={openEditModal}
          accessibilityLabel="Change avatar"
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
            <Text style={styles.avatarEmoji}>{currentUser.avatar || "🎵"}</Text>
          </View>
          <View style={[styles.avatarEditBadge, { backgroundColor: colors.purple }]}>
            <Text style={styles.avatarEditIcon}>✎</Text>
          </View>
        </TouchableOpacity>

        {/* Display Name & Username */}
        <Text style={[styles.displayName, { color: colors.text }]}>
          {currentUser.displayName || currentUser.username}
        </Text>
        <Text style={[styles.usernameHandle, { color: colors.purpleLight }]}>
          @{currentUser.username}
        </Text>
        {currentUser.email ? (
          <Text style={[styles.email, { color: colors.textMuted }]}>{currentUser.email}</Text>
        ) : null}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.editButton, { borderColor: colors.purple, backgroundColor: colors.surface2 }]}
          onPress={openEditModal}
          accessibilityRole="button"
        >
          <Text style={[styles.editButtonText, { color: colors.purpleLight }]}>
            ✎ Edit profile & avatar
          </Text>
        </TouchableOpacity>

        {/* Musical Stats & Level Progress Card */}
        {stats && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelKicker, { color: colors.purpleLight }]}>
                  LEVEL {stats.level}
                </Text>
                <Text style={[styles.levelTitleText, { color: colors.text }]}>
                  {stats.title}
                </Text>
                <Text style={[styles.xpRatio, { color: colors.textMuted }]}>
                  {stats.xp} / {stats.nextLevelXp} XP ({stats.progressPercent}%)
                </Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[styles.streakCountText, { color: colors.purpleLight }]}>
                  {stats.streakCount}d
                </Text>
              </View>
            </View>
            <View style={[styles.xpBarTrack, { backgroundColor: colors.surface2 }]}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${stats.progressPercent}%`, backgroundColor: colors.purple },
                ]}
              />
            </View>
          </View>
        )}

        {/* Road to Intermediate Graduation Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: gradProgress.isGraduated ? colors.green : colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.levelKicker,
                  { color: gradProgress.isGraduated ? colors.green : colors.purpleLight },
                ]}
              >
                {gradProgress.isGraduated ? "INTERMEDIATE ACHIEVED 🎓" : "ROAD TO INTERMEDIATE 🚀"}
              </Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Graduation Milestones
              </Text>
              <Text style={[styles.xpRatio, { color: colors.textMuted }]}>
                {gradProgress.completedCount} / {gradProgress.totalCount} completed ({gradProgress.percent}%)
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.xpBarTrack,
              { backgroundColor: colors.surface2, marginTop: 4, marginBottom: 12 },
            ]}
          >
            <View
              style={[
                styles.xpBarFill,
                {
                  width: `${gradProgress.percent}%`,
                  backgroundColor: gradProgress.isGraduated ? colors.green : colors.purple,
                },
              ]}
            />
          </View>
          <View style={{ gap: 8 }}>
            {gradProgress.tasks.map((task) => (
              <View
                key={task.id}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: task.done ? colors.green : colors.textMuted,
                  }}
                >
                  {task.done ? "✓" : "○"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: task.done ? colors.text : colors.textMuted,
                      textDecorationLine: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {task.desc} ({task.current}/{task.target})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Badges Showcase Card */}
        {badges.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.sectionTitle, { color: colors.purpleLight }]}>Achievements</Text>
              <Text style={[styles.badgeRatio, { color: colors.textMuted }]}>
                {badges.filter((b) => b.unlocked).length} / {badges.length}
              </Text>
            </View>

            <View style={styles.badgesGrid}>
              {badges.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.badgeChip,
                    {
                      backgroundColor: b.unlocked ? colors.surface2 : "transparent",
                      borderColor: b.unlocked ? colors.purple : colors.border,
                      opacity: b.unlocked ? 1 : 0.45,
                    },
                  ]}
                  onPress={() => setSelectedBadge(b)}
                >
                  <Text style={styles.badgeChipIcon}>{b.icon}</Text>
                  <Text
                    style={[
                      styles.badgeChipName,
                      { color: b.unlocked ? colors.text : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.purpleLight }]}>Account details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Display Name</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {currentUser.displayName || currentUser.username}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Username</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>@{currentUser.username}</Text>
          </View>
          {currentUser.email ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{currentUser.email}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account Status</Text>
            <Text style={[styles.detailValue, { color: colors.green }]}>
              {isCloud ? "Cloud Synced ✓" : "Active"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Member since</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {currentUser.createdAt ? currentUser.createdAt.split("T")[0].split(" ")[0] : "Recently"}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account ID</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              #{typeof currentUser.id === "string" ? `${currentUser.id.slice(0, 8)}…` : currentUser.id}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={onLogout}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: colors.textMuted }]}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Badge Detail Modal */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedBadge && (
              <>
                <Text style={styles.modalBadgeIcon}>{selectedBadge.icon}</Text>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedBadge.name}</Text>
                <Text style={[styles.modalBadgeStatus, { color: selectedBadge.unlocked ? colors.green : colors.textMuted }]}>
                  {selectedBadge.unlocked ? "✓ Unlocked" : "🔒 Locked Achievement"}
                </Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>{selectedBadge.desc}</Text>
                <View style={[styles.badgeRewardPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                  <Text style={[styles.badgeRewardText, { color: colors.purpleLight }]}>
                    Reward: +{selectedBadge.xpReward} XP ⭐
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.purple, marginTop: 14 }]}
                  onPress={() => setSelectedBadge(null)}
                >
                  <Text style={styles.saveBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Choose a musical avatar and customize your display name.
            </Text>

            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            {/* Avatar Selector */}
            <Text style={[styles.inputLabel, { color: colors.purpleLight }]}>CHOOSE AVATAR</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((emoji) => {
                const isSelected = selectedAvatar === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: isSelected ? colors.purple : colors.surface2,
                        borderColor: isSelected ? colors.purpleLight : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedAvatar(emoji);
                      updateProfileDraftSession({ selectedAvatar: emoji });
                    }}
                  >
                    <Text style={styles.avatarOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Display Name Input */}
            <Text style={[styles.inputLabel, { color: colors.purpleLight }]}>DISPLAY NAME</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={displayNameInput}
              onChangeText={(text) => {
                setDisplayNameInput(text);
                updateProfileDraftSession({ displayNameInput: text });
              }}
              placeholder="Your display name"
              placeholderTextColor={colors.textMuted}
              maxLength={24}
              autoCapitalize="words"
            />

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={closeEditModal}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.purple }]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav active="profile" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 20, marginBottom: 4 },
  body: { width: "100%", alignItems: "center", paddingBottom: 24 },
  heading: { fontSize: 22, fontWeight: "800", marginBottom: 20 },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  avatarEmoji: { fontSize: 38 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarEditIcon: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  displayName: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  usernameHandle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  email: { fontSize: 12, marginBottom: 12 },
  editButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  editButtonText: { fontSize: 12, fontWeight: "700" },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelKicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  levelTitleText: { fontSize: 16, fontWeight: "800" },
  xpRatio: { fontSize: 11, marginTop: 2 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakEmoji: { fontSize: 15 },
  streakCountText: { fontSize: 13, fontWeight: "800" },
  xpBarTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  xpBarFill: { height: "100%", borderRadius: 3 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  badgeRatio: { fontSize: 12, fontWeight: "700" },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  badgeChip: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeChipIcon: { fontSize: 18 },
  badgeChipName: { fontSize: 11, fontWeight: "700", flex: 1 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 4,
  },
  buttonText: { fontSize: 14, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  modalSub: { fontSize: 12, textAlign: "center", marginBottom: 14, lineHeight: 18 },
  modalBadgeIcon: { fontSize: 48, marginBottom: 8 },
  modalBadgeStatus: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  badgeRewardPill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  badgeRewardText: { fontSize: 12, fontWeight: "800" },
  inputLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, alignSelf: "flex-start", marginBottom: 8 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOptionText: { fontSize: 22 },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: { color: "#ff4d4f", fontSize: 12, marginBottom: 8, textAlign: "center" },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
