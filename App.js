import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider } from "./src/theme";
import { useAppTheme } from "./src/theme";
import ScreenWrapper from "./src/components/ScreenWrapper";
import { clearCurrentUser, getCurrentUser, loginUser, registerUser, saveCurrentUser } from "./src/db/database";
import StartScreen from "./src/screens/StartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BuildChordScreen from "./src/screens/BuildChordScreen";
import ChordResultScreen from "./src/screens/ChordResultScreen";
import GuessChordScreen from "./src/screens/GuessChordScreen";
import LearnChordScreen from "./src/screens/LearnChordScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ProfileScreen from "./src/screens/Profile/ProfileScreen";
import NotLoggedIn from "./src/screens/Profile/NotLoggedIn";
import RegisterScreen from "./src/screens/Profile/RegisterScreen";
import PlaceholderScreen from "./src/screens/PlaceholderScreen";

// Only History and Profile remain unbuilt at this stage.
const PLACEHOLDER_TITLES = {
  history: "History",
  profile: "Profile",
};

function AppContent() {
  const { colors } = useAppTheme();
  const [screen, setScreen] = useState("start");
  const [lastResult, setLastResult] = useState(null);
  const [signedInUser, setSignedInUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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

  const goHome = () => setScreen("home");
  const handleLogin = async (credentials) => {
    const user = await loginUser(credentials);
    if (!user) return false;
    await saveCurrentUser(user.id);
    setSignedInUser(user);
    return true;
  };

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

  if (screen === "profile") {
    if (!authReady) {
      return (
        <ScreenWrapper>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={colors.purple} />
          </View>
        </ScreenWrapper>
      );
    }

    if (!signedInUser) {
      return (
        <NotLoggedIn
          onLogin={handleLogin}
          onBack={goHome}
          onNavigate={setScreen}
        />
      );
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

  if (screen === "register") {
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
