import React, { useState } from "react";
import StartScreen from "./src/screens/StartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BuildChordScreen from "./src/screens/BuildChordScreen";
import ChordResultScreen from "./src/screens/ChordResultScreen";
import PlaceholderScreen from "./src/screens/PlaceholderScreen";

const PLACEHOLDER_TITLES = {
  guess: "Guess the Chord",
  learn: "Learn a Chord",
  settings: "Settings",
  history: "History",
  profile: "Profile",
};

export default function App() {
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

  if (PLACEHOLDER_TITLES[screen]) {
    return (
      <PlaceholderScreen
        title={PLACEHOLDER_TITLES[screen]}
        active={["settings", "history", "profile"].includes(screen) ? screen : "home"}
        onBack={goHome}
        onNavigate={setScreen}
      />
    );
  }

  return <HomeScreen onNavigate={setScreen} />;
}
