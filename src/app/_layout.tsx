import { useEffect, useState } from "react";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { I18nextProvider } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { useEffectiveColorScheme } from "@/hooks/use-theme-color";
import { Colors } from "@/constants/theme";
import i18n, { initI18n } from "@/i18n";
import { initUserDatabase, initVocabDatabase } from "@/db/database";
import { useAppStore } from "@/store";

SplashScreen.setOptions({
  fade: true,
});
SplashScreen.preventAutoHideAsync();

const LightNavigationTheme: Theme = {
  dark: false,
  colors: {
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.error,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "900" },
  },
};

const DarkNavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.error,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "900" },
  },
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const colorScheme = useEffectiveColorScheme();

  useEffect(() => {
    async function prepare() {
      try {
        await initI18n();
        await Promise.all([initUserDatabase(), initVocabDatabase()]);
        setInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [setInitialized]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const navigationTheme =
    colorScheme === "dark" ? DarkNavigationTheme : LightNavigationTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="categories"
                options={{
                  presentation: "transparentModal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  presentation: "transparentModal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen name="word/[id]" />
              <Stack.Screen name="practice/meaning-match" />
              <Stack.Screen name="practice/fill-gap" />
              <Stack.Screen name="practice/guess-word" />
              <Stack.Screen name="practice/synonyms" />
              <Stack.Screen
                name="settings"
                options={{
                  presentation: "modal",
                }}
              />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </ThemeProvider>
        </I18nextProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
