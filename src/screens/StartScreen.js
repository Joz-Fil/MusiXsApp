import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";

export default function StartScreen({ onStart }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Image
          source={require("../assets/musixs-icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.purple }]}
          onPress={onStart}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { position: "absolute", top: 10, fontSize: 22, fontWeight: "800" },
  icon: { width: 120, height: 120, borderRadius: 28, marginBottom: 36 },
  button: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 40 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
