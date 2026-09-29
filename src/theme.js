import React, { createContext, useContext, useState } from "react";

export const darkColors = {
  bg: "#322f3d",
  surface: "#423f4f",
  surface2: "#4d4a5c",
  border: "#5d5a70",
  purple: "#8b7cf6",
  purpleLight: "#b49cee",
  text: "#ffffff",
  textMuted: "#b8b5c4",
  green: "#4caf50",
  greenBg: "#2e7d32",
  red: "#f44336",
  redBg: "#c62828",
  glow: "rgba(139, 124, 246, 0.55)",
  glass: "rgba(255, 255, 255, 0.07)",
  glassBorder: "rgba(255, 255, 255, 0.16)",
};

export const lightColors = {
  bg: "#f4f1fb",
  surface: "#ffffff",
  surface2: "#ede9fb",
  border: "#ddd7ef",
  purple: "#6e4ff0",
  purpleLight: "#4b33a8",
  text: "#1a1a1a",
  textMuted: "#5b5b5b",
  green: "#2e7d32",
  greenBg: "#d9f2e1",
  red: "#c62828",
  redBg: "#fbe1e1",
  glow: "rgba(110, 79, 240, 0.30)",
  glass: "rgba(255, 255, 255, 0.62)",
  glassBorder: "rgba(110, 79, 240, 0.18)",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark"); // "dark" | "light"
  const colors = mode === "dark" ? darkColors : lightColors;

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook every screen uses to get current colors + the toggle function.
export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used inside a ThemeProvider");
  }
  return ctx;
}
