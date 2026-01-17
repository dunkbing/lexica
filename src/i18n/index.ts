import i18n, {
  changeLanguage as i18nChangeLanguage,
  use as loadModule,
} from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { en, vi } from "./locales";

const LANGUAGE_KEY = "@vocab/language";

export const supportedLanguages = {
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt" },
  en: { name: "English", nativeName: "English" },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  if (deviceLocale && deviceLocale in supportedLanguages) {
    return deviceLocale as SupportedLanguage;
  }
  return "vi"; // Default to Vietnamese
};

export const getStoredLanguage =
  async (): Promise<SupportedLanguage | null> => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && stored in supportedLanguages) {
        return stored as SupportedLanguage;
      }
      return null;
    } catch {
      return null;
    }
  };

export const setStoredLanguage = async (
  language: SupportedLanguage,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Failed to store language preference:", error);
  }
};

export const initI18n = async (): Promise<void> => {
  const storedLanguage = await getStoredLanguage();
  const initialLanguage = storedLanguage || getDeviceLanguage();

  await loadModule(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

export const changeLanguage = async (
  language: SupportedLanguage,
): Promise<void> => {
  await i18nChangeLanguage(language);
  await setStoredLanguage(language);
};

export default i18n;
