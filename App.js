import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemeProvider, useAppTheme } from "./src/theme";
import ScreenWrapper from "./src/components/ScreenWrapper";
import AnimatedSwitch from "./src/components/AnimatedSwitch";
import {
  clearCurrentUser,
  getCurrentUser,
  loginUser,
  registerUser,
  saveCurrentUser,
} from "./src/db/database";
import { AudioProvider, useAudio } from "./src/audio/AudioContext";
import SplashIntroScreen from "./src/screens/SplashIntroScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BuildChordScreen from "./src/screens/BuildChordScreen";
import ChordResultScreen from "./src/screens/ChordResultScreen";
import GuessChordScreen from "./src/screens/GuessChordScreen";
import LearnChordScreen from "./src/screens/LearnChordScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ProfileScreen from "./src/screens/Profile/ProfileScreen";
import NotLoggedIn from "./src/screens/Profile/NotLoggedIn";
import RegisterScreen from "./src/screens/Profile/RegisterScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

function AppContent() {
  const { colors } = useAppTheme();
  const { markAudioUnlocked, startMenuMusic, primeMenuMusic } = useAudio();
  const [screen, setScreen] = useState("intro");
  const [lastResult, setLastResult] = useState(null);
  const [signedInUser, setSignedInUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  // The intro is the only screen before the music exists; remembering that it
  // has started keeps this effect from firing it up during the intro.
  const musicStarted = useRef(false);

  // Restore the saved SQLite session while the intro plays; nothing blocks.
  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((user) => {
        if (mounted) setSignedInUser(user);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAuthReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Synthesize the 30s lofi loop once, up front, so it is cached by the time
  // the intro hands over to the menu (the only expensive audio step).
  useEffect(() => {
    primeMenuMusic();
  }, [primeMenuMusic]);

  const goHome = () => setScreen("home");
  const handleLogin = async (credentials) => {
    const user = await loginUser(credentials);
    if (!user) return false;
    await saveCurrentUser(user.id);
    setSignedInUser(user);
    return true;
  };

  // Intro finished -> main menu: the one place the menu music is started.
  // From there it plays at all times, on every screen — chord samples duck it
  // to a whisper while they sound and it fades right back afterwards.
  const handleIntroDone = () => {
    musicStarted.current = true;
    setScreen("home");
    startMenuMusic();
  };

  // First touch anywhere retries audio that autoplay policies blocked.
  const handleRootTouchStart = () => {
    markAudioUnlocked();
    return false;
  };
  const renderRoute = (key) => {
    if (key === "intro") {
      return <SplashIntroScreen onDone={handleIntroDone} />;
    }
    if (key === "home") {
      return <HomeScreen onNavigate={setScreen} />;
    }
    if (key === "build") {
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
    if (key === "result") {
      return (
        <ChordResultScreen
          result={lastResult}
          onNavigate={setScreen}
          onBuildAnother={() => setScreen("build")}
        />
      );
    }
    if (key === "guess") {
      return <GuessChordScreen onBack={goHome} onNavigate={setScreen} />;
    }
    if (key === "learn") {
      return <LearnChordScreen onBack={goHome} onNavigate={setScreen} />;
    }
    if (key === "settings") {
      return <SettingsScreen onBack={goHome} onNavigate={setScreen} />;
    }
    if (key === "profile") {
      if (!authReady) {
        return (
          <ScreenWrapper>
            <View style={styles.loading}>
              <ActivityIndicator color={colors.purple} />
            </View>
          </ScreenWrapper>
        );
      }
      if (!signedInUser) {
        return <NotLoggedIn onLogin={handleLogin} onBack={goHome} onNavigate={setScreen} />;
      }
      return (
        <ProfileScreen
          user={signedInUser}
          onLogout={async () => {
            await clearCurrentUser();
            setSignedInUser(null);
          }}
          onBack={goHome}
          onNavigate={setScreen}
        />
      );
    }
    if (key === "register") {
      return (
        <RegisterScreen
          onBack={() => setScreen("profile")}
          onRegister={async (account) => {
            const user = await registerUser(account);
            await saveCurrentUser(user.id);
            setSignedInUser(user);
            setScreen("profile");
          }}
        />
      );
    }
    if (key === "history") {
      return <HistoryScreen onBack={goHome} onNavigate={setScreen} />;
    }
    return <HomeScreen onNavigate={setScreen} />;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]} onStartShouldSetResponderCapture={handleRootTouchStart}>
      <AnimatedSwitch activeKey={screen} render={renderRoute} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
