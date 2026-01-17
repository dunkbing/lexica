import { useState, useEffect } from "react";
import { Dimensions, type ScaledSize } from "react-native";

const TABLET_BREAKPOINT = 768;
const SIDEBAR_WIDTH = 280;

export interface ResponsiveConfig {
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  // Grid columns
  searchGridColumns: number;
  deckGridColumns: number;
  practiceGroupItemsPerRow: number;
  radicalGridItemSize: number;
  // Canvas
  canvasSize: number;
  // Spacing
  contentPadding: number;
  tabletTopPadding: number;
  tabletSpacing: number;
  // Navigation
  sidebarWidth: number;
}

function calculateConfig(dimensions: ScaledSize): ResponsiveConfig {
  const { width, height } = dimensions;
  const isTablet = width >= TABLET_BREAKPOINT;

  const contentWidth = isTablet ? width - SIDEBAR_WIDTH : width;

  return {
    isTablet,
    screenWidth: width,
    screenHeight: height,
    // Grid columns - more columns on tablet
    searchGridColumns: isTablet ? 5 : 3,
    deckGridColumns: isTablet ? 3 : 2,
    practiceGroupItemsPerRow: isTablet ? 5 : 3,
    radicalGridItemSize: isTablet ? 56 : 48,
    // Canvas - larger on tablet
    canvasSize: isTablet
      ? Math.min(contentWidth - 120, 450)
      : Math.min(width - 64, 300),
    // Spacing
    contentPadding: isTablet ? 24 : 16,
    tabletTopPadding: isTablet ? 24 : 0,
    tabletSpacing: isTablet ? 24 : 0,
    // Navigation
    sidebarWidth: SIDEBAR_WIDTH,
  };
}

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() =>
    calculateConfig(Dimensions.get("window")),
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setConfig(calculateConfig(window));
    });

    return () => subscription.remove();
  }, []);

  return config;
}
