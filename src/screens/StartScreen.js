import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";

export default function StartScreen({ onStart }) {
  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <Text style={[styles.title, styles.titleAbsolute]}>MusiXs</Text>
        <Image
          source={require("../assets/musixs-icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.button} onPress={onStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.purpleLight,
    fontSize: 22,
    fontWeight: "800",
  },
  titleAbsolute: {
    position: "absolute",
    top: 10,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 36,
  },
  button: {
    backgroundColor: colors.purple,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
