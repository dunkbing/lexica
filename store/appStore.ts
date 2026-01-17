import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedLanguage } from "@/i18n";

export type ThemeMode = "light" | "dark" | "system";
export type DailyGoal = 3 | 5 | 7 | 10;
export type VoiceGender = "male" | "female";

interface AppState {
  // Settings
  theme: ThemeMode;
  language: SupportedLanguage;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  dailyGoal: DailyGoal;
  voiceGender: VoiceGender;

  // Notification settings
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;

  // App state
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  setVoiceGender: (gender: VoiceGender) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderTime: (hour: number, minute: number) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Default settings
      theme: "light",
      language: "vi",
      soundEnabled: true,
      hapticsEnabled: true,
      dailyGoal: 5,
      voiceGender: "female",
      notificationsEnabled: false,
      reminderHour: 20,
      reminderMinute: 0,
      isInitialized: false,
      isLoading: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setVoiceGender: (voiceGender) => set({ voiceGender }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setReminderTime: (reminderHour, reminderMinute) =>
        set({ reminderHour, reminderMinute }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "vocab-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        dailyGoal: state.dailyGoal,
        voiceGender: state.voiceGender,
        notificationsEnabled: state.notificationsEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
      }),
    },
  ),
);
