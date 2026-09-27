import React, { useState } from "react";
import { ThemeProvider } from "./src/theme";
import StartScreen from "./src/screens/StartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BuildChordScreen from "./src/screens/BuildChordScreen";
import ChordResultScreen from "./src/screens/ChordResultScreen";
import GuessChordScreen from "./src/screens/GuessChordScreen";
import LearnChordScreen from "./src/screens/LearnChordScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PlaceholderScreen from "./src/screens/PlaceholderScreen";

// Only History and Profile remain unbuilt at this stage.
const PLACEHOLDER_TITLES = {
  history: "History",
  profile: "Profile",
};

function AppContent() {
  const [screen, setScreen] = useState("start");
  const [lastResult, setLastResult] = useState(null);

  const goHome = () => setScreen("home");

  if (screen === "start") {
    return <StartScreen onStart={() => setScreen("home")} />;
  }

  if (screen === "home") {
    return <HomeScreen onNavigate={setScreen} />;
  }

  if (screen === "build") {
    return (
      <BuildChordScreen
        onBack={goHome}
        onNavigate={setScreen}
        onBuilt={(result) => {
          setLastResult(result);
          setScreen("result");
        }}
      />
    );
  }

  if (screen === "result") {
    return (
      <ChordResultScreen
        result={lastResult}
        onNavigate={setScreen}
        onBuildAnother={() => setScreen("build")}
      />
    );
  }

  if (screen === "guess") {
    return <GuessChordScreen onBack={goHome} onNavigate={setScreen} />;
  }

  if (screen === "learn") {
    return <LearnChordScreen onBack={goHome} onNavigate={setScreen} />;
  }

  if (screen === "settings") {
    return <SettingsScreen onBack={goHome} onNavigate={setScreen} />;
  }

  if (PLACEHOLDER_TITLES[screen]) {
    return (
      <PlaceholderScreen
        title={PLACEHOLDER_TITLES[screen]}
        active={screen}
        onBack={goHome}
        onNavigate={setScreen}
      />
    );
  }

  return <HomeScreen onNavigate={setScreen} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
