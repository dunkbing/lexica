import { StyleSheet, View, TouchableOpacity, Animated } from "react-native";
import { Route, usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

interface NavItem {
  name: string;
  path: string;
  icon: IconSymbolName;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "index", path: "/", icon: "house.fill", labelKey: "tabs.home" },
];

const COLLAPSED_WIDTH = 68;

interface SidebarProps {
  width: number;
}

export function Sidebar({ width }: SidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const animatedWidth = useRef(new Animated.Value(width)).current;

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const tabIconDefault = useThemeColor({}, "tabIconDefault");
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "background",
  );

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isCollapsed ? COLLAPSED_WIDTH : width,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed, width, animatedWidth]);

  const isActive = (item: NavItem) => {
    if (item.name === "index") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(`/${item.name}`);
  };

  const handlePress = (item: NavItem) => {
    router.push(item.path as Route);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: animatedWidth,
          backgroundColor,
          borderRightColor: borderColor,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Header with toggle */}
      <View style={[styles.header, isCollapsed && styles.headerCollapsed]}>
        {!isCollapsed && (
          <ThemedText type="title" style={styles.appTitle}>
            Lexica
          </ThemedText>
        )}
        <TouchableOpacity
          onPress={toggleSidebar}
          style={styles.toggleButton}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={isCollapsed ? "sidebar.right" : "sidebar.left"}
            size={20}
            color={tabIconDefault}
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <View style={styles.navItems}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                active && { backgroundColor: `${tintColor}15` },
              ]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={item.icon}
                size={22}
                color={active ? tintColor : tabIconDefault}
              />
              {!isCollapsed && (
                <ThemedText
                  style={[
                    styles.navLabel,
                    { color: active ? tintColor : tabIconDefault },
                    active && styles.navLabelActive,
                  ]}
                >
                  {t(item.labelKey)}
                </ThemedText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Settings at bottom */}
      <View style={[styles.footer, { borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.navItem, isCollapsed && styles.navItemCollapsed]}
          onPress={() => router.push("/settings")}
          activeOpacity={0.7}
        >
          <IconSymbol name="gearshape.fill" size={22} color={tabIconDefault} />
          {!isCollapsed && (
            <ThemedText style={[styles.navLabel, { color: tabIconDefault }]}>
              {t("settings.title")}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRightWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  appTitle: {
    fontSize: 28,
  },
  toggleButton: {
    padding: 8,
  },
  navItems: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  navLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  navLabelActive: {
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
});
