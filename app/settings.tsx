import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Switch,
  TouchableOpacity,
  Text,
  Platform,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import {
  useThemeColor,
  useEffectiveColorScheme,
} from "@/hooks/use-theme-color";
import { Card } from "@/components/ui";
import { useAppStore, type ThemeMode } from "@/store";
import {
  changeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n";
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  formatTime,
} from "@/lib/notifications";

export default function SettingsScreen() {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { t } = useTranslation();
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const colorScheme = useEffectiveColorScheme();
  const cardBgColor = useThemeColor({}, "sheetBackground");

  const {
    theme,
    language,
    soundEnabled,
    hapticsEnabled,
    notificationsEnabled,
    reminderHour,
    reminderMinute,
    setTheme,
    setLanguage,
    setSoundEnabled,
    setHapticsEnabled,
    setNotificationsEnabled,
    setReminderTime,
  } = useAppStore();

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        return;
      }

      setNotificationsEnabled(true);
      await scheduleDailyReminder(
        reminderHour,
        reminderMinute,
        "Reminder",
        "Don't forget to check the app!",
      );
    } else {
      setNotificationsEnabled(false);
      await cancelDailyReminder();
    }
  };

  const handleTimeChange = async (
    _event: unknown,
    selectedDate: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      setReminderTime(hour, minute);

      if (notificationsEnabled) {
        await scheduleDailyReminder(hour, minute, "Reminder", "Time to check in!");
      }
    }
  };

  const SettingRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <ThemedText>{label}</ThemedText>
      {value && <ThemedText style={styles.settingValue}>{value}</ThemedText>}
    </TouchableOpacity>
  );

  const SettingSwitch = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <ThemedText>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: tintColor }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Language Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("settings.language")}
          </ThemedText>
          <Card variant="outlined">
            {(Object.keys(supportedLanguages) as SupportedLanguage[]).map(
              (lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.settingRow,
                    language === lang && { backgroundColor: `${tintColor}20` },
                  ]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <ThemedText>{supportedLanguages[lang].nativeName}</ThemedText>
                  {language === lang && (
                    <Text style={[styles.checkmark, { color: tintColor }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ),
            )}
          </Card>
        </View>

        {/* Theme Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("settings.theme")}
          </ThemedText>
          <Card variant="outlined">
            {(["system", "light", "dark"] as ThemeMode[]).map((themeOption) => (
              <TouchableOpacity
                key={themeOption}
                style={[
                  styles.settingRow,
                  theme === themeOption && {
                    backgroundColor: `${tintColor}20`,
                  },
                ]}
                onPress={() => handleThemeChange(themeOption)}
              >
                <ThemedText>{t(`settings.${themeOption}`)}</ThemedText>
                {theme === themeOption && (
                  <Text style={[styles.checkmark, { color: tintColor }]}>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("settings.notifications")}
          </ThemedText>
          <Card variant="outlined">
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <ThemedText>{t("settings.notifications")}</ThemedText>
                <ThemedText style={styles.settingDesc}>
                  {t("settings.notificationsDesc")}
                </ThemedText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsChange}
                trackColor={{ false: "#767577", true: tintColor }}
                thumbColor="#FFFFFF"
              />
            </View>
            {notificationsEnabled && (
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowTimePicker(true)}
              >
                <ThemedText>{t("settings.reminderTime")}</ThemedText>
                <ThemedText style={[styles.settingValue, { color: tintColor }]}>
                  {formatTime(reminderHour, reminderMinute)}
                </ThemedText>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Time Picker Modal for iOS */}
        {Platform.OS === "ios" && (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <View
                style={[
                  styles.pickerModalContent,
                  { backgroundColor: cardBgColor },
                ]}
              >
                <View
                  style={[
                    styles.pickerModalHeader,
                    {
                      borderBottomColor:
                        colorScheme === "dark" ? "#3A3A3C" : "#E5E7EB",
                    },
                  ]}
                >
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text
                      style={[styles.pickerModalButton, { color: tintColor }]}
                    >
                      {t("common.done")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={new Date(2024, 0, 1, reminderHour, reminderMinute)}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  themeVariant={colorScheme}
                  accentColor={tintColor}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Time Picker for Android */}
        {Platform.OS === "android" && showTimePicker && (
          <DateTimePicker
            value={new Date(2024, 0, 1, reminderHour, reminderMinute)}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            themeVariant={colorScheme}
            accentColor={tintColor}
          />
        )}

        {/* Preferences */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Preferences
          </ThemedText>
          <Card variant="outlined">
            <SettingSwitch
              label={t("settings.sound")}
              value={soundEnabled}
              onValueChange={setSoundEnabled}
            />
            <SettingSwitch
              label={t("settings.haptics")}
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
            />
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t("settings.about")}
          </ThemedText>
          <Card variant="outlined">
            <SettingRow
              label={t("settings.version")}
              value={`${Constants.expoConfig?.version ?? "1.0.0"} (${
                Platform.OS === "ios"
                  ? (Constants.expoConfig?.ios?.buildNumber ?? "1")
                  : (Constants.expoConfig?.android?.versionCode ?? "1")
              })`}
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  settingValue: {
    opacity: 0.7,
  },
  settingDesc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "bold",
  },
  settingLabelContainer: {
    flex: 1,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  pickerModalButton: {
    fontSize: 17,
    fontWeight: "600",
  },
});
