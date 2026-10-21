import React, { useState } from "react";
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

const AVATAR_OPTIONS = ["🎵", "🎸", "🎹", "🎧", "🎼", "🎷", "🎤", "⚡", "🌟", "🥁"];

export default function ProfileScreen({ user, onUserUpdate, onLogout, onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const [currentUser, setCurrentUser] = useState(user);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || "🎵");
  const [displayNameInput, setDisplayNameInput] = useState(currentUser.displayName || currentUser.username || "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const isCloud = currentUser?.isCloud ?? isSupabaseConfigured();

  const openEditModal = () => {
    setSelectedAvatar(currentUser.avatar || "🎵");
    setDisplayNameInput(currentUser.displayName || currentUser.username || "");
    setEditError("");
    setEditModalVisible(true);
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
      setEditModalVisible(false);
    } catch (err) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to home">
        <Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.heading, { color: colors.text }]}>My profile</Text>

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

        {/* Details Card */}
        <View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Choose a musical avatar and customize your display name.
            </Text>

            {/* Avatar Selector */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Choose Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((av) => {
                const isSelected = selectedAvatar === av;
                return (
                  <TouchableOpacity
                    key={av}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: isSelected ? colors.surface2 : "transparent",
                        borderColor: isSelected ? colors.purple : colors.border,
                        transform: [{ scale: isSelected ? 1.12 : 1 }],
                      },
                    ]}
                    onPress={() => setSelectedAvatar(av)}
                  >
                    <Text style={styles.avatarOptionText}>{av}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Display Name Input */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Display Name</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
              ]}
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              placeholder="e.g. Master Producer"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
            />

            {!!editError && (
              <View style={[styles.errorBox, { backgroundColor: colors.redBg }]}>
                <Text style={[styles.errorText, { color: colors.red }]}>{editError}</Text>
              </View>
            )}

            {/* Modal Buttons */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.purple }]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 20, marginBottom: 4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 24 },
  heading: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  avatarWrap: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: "rgba(139, 124, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 44 },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarEditIcon: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  displayName: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  usernameHandle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 13, marginBottom: 12 },
  editButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  details: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", paddingTop: 14, paddingBottom: 8 },
  detailRow: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.16)",
  },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  button: {
    width: "100%",
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 14, fontWeight: "700" },

  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4, textAlign: "center" },
  modalSub: { fontSize: 13, textAlign: "center", marginBottom: 18, lineHeight: 18 },
  inputLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 18,
  },
  avatarOption: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOptionText: { fontSize: 24 },
  modalInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600" },
});
