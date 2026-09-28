import React, { createContext, useContext, useState } from "react";

export const darkColors = {
  bg: "#191A22",
  surface: "#232530",
  surface2: "#2D303D",
  border: "#383B49",
  purple: "#9A87FA",
  purpleLight: "#C5B9FF",
  text: "#F7F5FC",
  textMuted: "#A5A2B2",
  green: "#63C89A",
  greenBg: "#203A33",
  red: "#F17985",
  redBg: "#452A32",
};

export const lightColors = {
  bg: "#F2F0F7",
  surface: "#FFFFFF",
  surface2: "#E9E6F1",
  border: "#D9D5E4",
  purple: "#6849DE",
  purpleLight: "#4B33A8",
  text: "#211E2A",
  textMuted: "#706C7B",
  green: "#267857",
  greenBg: "#DDF2E8",
  red: "#B83D4D",
  redBg: "#F8E4E7",
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
