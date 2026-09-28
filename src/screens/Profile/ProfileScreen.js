import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAppTheme } from "../../theme";

export default function ProfileScreen({ user, onLogout, onBack, onNavigate }) {
	const { colors } = useAppTheme();

	return (
		<ScreenWrapper>
			<TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to home">
				<Text style={[styles.back, { color: colors.purpleLight }]}>←</Text>
			</TouchableOpacity>
			<View style={styles.body}>
				<Text style={[styles.heading, { color: colors.text }]}>My profile</Text>
				<View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
					<Text style={[styles.avatarText, { color: colors.purpleLight }]}>
						{user.username.charAt(0).toUpperCase()}
					</Text>
				</View>
				<Text style={[styles.title, { color: colors.text }]}>{user.username}</Text>
				<Text style={[styles.subtitle, { color: colors.textMuted }]}>MusiXs member</Text>
				<View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
					<Text style={[styles.sectionTitle, { color: colors.purpleLight }]}>Account details</Text>
					<View style={styles.detailRow}>
						<Text style={[styles.detailLabel, { color: colors.textMuted }]}>Username</Text>
						<Text style={[styles.detailValue, { color: colors.text }]}>{user.username}</Text>
					</View>
					<View style={styles.detailRow}>
						<Text style={[styles.detailLabel, { color: colors.textMuted }]}>Member since</Text>
						<Text style={[styles.detailValue, { color: colors.text }]}>
							{user.createdAt ? user.createdAt.split(" ")[0] : "Recently"}
						</Text>
					</View>
					<View style={[styles.detailRow, styles.lastDetailRow]}>
						<Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account ID</Text>
						<Text style={[styles.detailValue, { color: colors.text }]}>#{user.id}</Text>
					</View>
				</View>
				<TouchableOpacity
					style={[styles.button, { borderColor: colors.purple }]}
					onPress={onLogout}
					accessibilityRole="button"
				>
					<Text style={[styles.buttonText, { color: colors.purpleLight }]}>Log out</Text>
				</TouchableOpacity>
			</View>
			<BottomNav active="profile" onNavigate={onNavigate} />
		</ScreenWrapper>
	);
}

const styles = StyleSheet.create({
	back: { fontSize: 20, marginBottom: 4 },
	body: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 24 },
	heading: { fontSize: 22, fontWeight: "800", marginBottom: 24 },
	avatar: {
		width: 76,
		height: 76,
		borderRadius: 38,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 18,
	},
	avatarText: { fontSize: 30, fontWeight: "700" },
	title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
	subtitle: { fontSize: 15, textAlign: "center", marginBottom: 24 },
	details: { width: "100%", borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 20 },
	sectionTitle: { fontSize: 14, fontWeight: "700", paddingTop: 14, paddingBottom: 4 },
	detailRow: {
		minHeight: 46,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderBottomWidth: 1,
						borderColor: "rgba(128, 128, 128, 0.16)",
	},
	lastDetailRow: { borderBottomWidth: 0 },
	detailLabel: { fontSize: 14 },
	detailValue: { fontSize: 14, fontWeight: "600" },
	button: {
		width: "100%",
		minHeight: 50,
		borderWidth: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: { fontSize: 16, fontWeight: "700" },
});
