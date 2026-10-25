import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";

const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });

function HomeIcon({ color, size = 20 }) {
  const roofW = Math.round(size * 0.85);
  const roofH = Math.round(size * 0.38);
  const bodyW = Math.round(size * 0.65);
  const bodyH = Math.round(size * 0.44);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: roofW / 2,
          borderRightWidth: roofW / 2,
          borderBottomWidth: roofH,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: bodyW,
          height: bodyH,
          backgroundColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            width: Math.round(bodyW * 0.36),
            height: Math.round(bodyH * 0.6),
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        />
      </View>
    </View>
  );
}

function JourneyIcon({ color, size = 20 }) {
  const dSize = Math.round(size * 0.7);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: dSize,
          height: dSize,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 3,
          transform: [{ rotate: "45deg" }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: Math.round(dSize * 0.4),
            height: Math.round(dSize * 0.4),
            borderRadius: 1.5,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function HistoryIcon({ color, size = 20 }) {
  const w = Math.round(size * 0.75);
  const h = Math.round(size * 0.88);
  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        borderWidth: 1.8,
        borderColor: color,
        paddingHorizontal: 2.5,
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <View style={{ width: "80%", height: 1.6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: "80%", height: 1.6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: "50%", height: 1.6, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function ProfileIcon({ color, size = 20 }) {
  const headSize = Math.round(size * 0.42);
  const bodyWidth = Math.round(size * 0.82);
  const bodyHeight = Math.round(size * 0.38);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          backgroundColor: color,
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function SettingsIcon({ color, size = 20 }) {
  const outer = Math.round(size * 0.85);
  const inner = Math.round(size * 0.32);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: outer,
          height: Math.round(outer * 0.28),
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: Math.round(outer * 0.28),
          height: outer,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: outer,
          height: Math.round(outer * 0.28),
          backgroundColor: color,
          borderRadius: 2,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: Math.round(outer * 0.28),
          height: outer,
          backgroundColor: color,
          borderRadius: 2,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          width: Math.round(outer * 0.7),
          height: Math.round(outer * 0.7),
          borderRadius: Math.round(outer * 0.7) / 2,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        />
      </View>
    </View>
  );
}

const TABS = [
  { key: "home", label: "Home", renderIcon: (c) => <HomeIcon color={c} size={20} /> },
  { key: "journey", label: "Journey", renderIcon: (c) => <JourneyIcon color={c} size={20} /> },
  { key: "history", label: "History", renderIcon: (c) => <HistoryIcon color={c} size={20} /> },
  { key: "profile", label: "Profile", renderIcon: (c) => <ProfileIcon color={c} size={20} /> },
  { key: "settings", label: "Settings", renderIcon: (c) => <SettingsIcon color={c} size={20} /> },
];

export default function BottomNav({ active, onNavigate }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Elevate the bottom navigation bar above the Android system navigation bar (3-button or gesture pill)
  // so tapping tabs—especially the Home tab in the middle—never triggers the Android Home button.
  const bottomOffset = Platform.select({
    android: Math.max(insets.bottom + 18, 34),
    ios: insets.bottom > 0 ? insets.bottom + 8 : 16,
    default: 16,
  });

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: bottomOffset,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const iconColor = isActive ? colors.purpleLight : colors.textMuted;

        return (
          <TouchButton
            key={tab.key}
            style={styles.item}
            pressScale={0.86}
            pulseKey={isActive ? `active-${tab.key}` : undefined}
            onPress={() => onNavigate(tab.key)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? colors.surface2 : "transparent",
                },
                isActive && Platform.select({
                  ios: {
                    shadowColor: colors.purple,
                    shadowOpacity: 0.55,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  android: {
                    elevation: 0,
                  },
                  default: {
                    shadowColor: colors.purple,
                    shadowOpacity: 0.55,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  },
                }),
              ]}
            >
              {tab.renderIcon(iconColor)}
            </View>
          </TouchButton>
        );
      })}
    </View>
  );
}

BottomNav.isBottomNav = true;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    maxWidth: 420,
    height: 62,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    alignSelf: "center",
  },
  item: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    width: 48,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
