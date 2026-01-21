import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useTranslation } from "react-i18next";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppStore } from "@/store";
import { Word } from "@/types";
import { IconSymbol } from "./ui/icon-symbol";
import { Pill } from "./ui/pill";
import { IconButton } from "./ui/icon-button";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 480);

interface WordCardProps {
  word: Word;
  onSwipeRight: () => void; // User knows
  onSwipeLeft: () => void; // Need to review
  onInfoPress: () => void;
  onFavoritePress: () => void;
  onSharePress: () => void;
  isFavorite: boolean;
  onSwipeProgress?: (progress: number) => void; // 0 = center, 1 = threshold reached
}

export function WordCard({
  word,
  onSwipeRight,
  onSwipeLeft,
  onInfoPress,
  onFavoritePress,
  onSharePress,
  isFavorite,
  onSwipeProgress,
}: WordCardProps) {
  const { t, i18n } = useTranslation();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  const backgroundColor = useThemeColor({}, "wordCardBg");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const borderColor = useThemeColor({}, "border");

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const hasTriggeredHaptic = useRef(false);

  const triggerHaptic = useCallback(
    (type: "success" | "warning") => {
      if (!hapticsEnabled) return;
      if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
    [hapticsEnabled],
  );

  const speak = useCallback(() => {
    if (!soundEnabled) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Speech.speak(word.term, {
      language: "en-US",
      rate: 0.8,
    });
  }, [word.term, soundEnabled, hapticsEnabled]);

  const resetCard = useCallback(
    (animated = true) => {
      if (animated) {
        const timingConfig = { duration: 200 };
        translateX.value = withTiming(0, timingConfig);
        translateY.value = withTiming(0, timingConfig);
        rotation.value = withTiming(0, timingConfig);
        scale.value = withTiming(1, timingConfig);
      } else {
        translateX.value = 0;
        translateY.value = 0;
        rotation.value = 0;
        scale.value = 1;
      }
      hasTriggeredHaptic.current = false;
    },
    [translateX, translateY, rotation, scale],
  );

  // Reset card position when word changes
  useEffect(() => {
    resetCard(false);
  }, [word.id, resetCard]);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    },
    [onSwipeRight, onSwipeLeft],
  );

  const reportProgress = useCallback(
    (translationX: number) => {
      if (onSwipeProgress) {
        const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
        onSwipeProgress(progress);
      }
    },
    [onSwipeProgress],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolation.CLAMP,
      );

      // Report swipe progress
      scheduleOnRN(reportProgress, event.translationX);

      // Trigger haptic when crossing threshold
      if (
        Math.abs(event.translationX) > SWIPE_THRESHOLD &&
        !hasTriggeredHaptic.current
      ) {
        hasTriggeredHaptic.current = true;
        if (event.translationX > 0) {
          scheduleOnRN(triggerHaptic, "success");
        } else {
          scheduleOnRN(triggerHaptic, "warning");
        }
      } else if (Math.abs(event.translationX) < SWIPE_THRESHOLD) {
        hasTriggeredHaptic.current = false;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 });
        rotation.value = withTiming(30, { duration: 250 });
        scheduleOnRN(reportProgress, SWIPE_THRESHOLD); // Keep at max
        scheduleOnRN(handleSwipeComplete, "right");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 });
        rotation.value = withTiming(-30, { duration: 250 });
        scheduleOnRN(reportProgress, SWIPE_THRESHOLD); // Keep at max
        scheduleOnRN(handleSwipeComplete, "left");
      } else {
        scheduleOnRN(reportProgress, 0); // Reset progress
        scheduleOnRN(resetCard, true);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const posLabel = t(`word.${word.pos}`) || `(${word.pos})`;
  const isVietnamese = i18n.language === "vi";

  // Get definition based on current language
  const primaryDefinition = isVietnamese
    ? word.definition.vi
    : word.definition.en;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.card, { backgroundColor, borderColor }, animatedStyle]}
      >
        {/* Know overlay */}
        <Animated.View
          style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}
        >
          <View
            style={[styles.overlayBadge, { backgroundColor: successColor }]}
          >
            <IconSymbol name="checkmark" size={24} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Review overlay */}
        <Animated.View
          style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}
        >
          <View
            style={[styles.overlayBadge, { backgroundColor: warningColor }]}
          >
            <IconSymbol
              name="arrow.counterclockwise"
              size={24}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Word */}
          <Text style={[styles.word, { color: textColor }]}>{word.term}</Text>

          {/* Pronunciation */}
          <TouchableOpacity onPress={speak} activeOpacity={0.7}>
            <Pill
              text={word.phonetic}
              icon={
                <IconSymbol
                  name="speaker.wave.2.fill"
                  size={16}
                  color={textSecondary}
                />
              }
              style={styles.pronunciation}
            />
          </TouchableOpacity>

          {/* Definition (in app language) */}
          <Text style={[styles.definition, { color: textColor }]}>
            {posLabel} {primaryDefinition}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <IconButton
            icon={
              <IconSymbol name="info.circle" size={24} color={textSecondary} />
            }
            onPress={onInfoPress}
            variant="outlined"
          />
          <IconButton
            icon={
              <IconSymbol
                name="square.and.arrow.up"
                size={24}
                color={textSecondary}
              />
            }
            onPress={onSharePress}
            variant="outlined"
          />
          <IconButton
            icon={
              <IconSymbol
                name={isFavorite ? "heart.fill" : "heart"}
                size={24}
                color={isFavorite ? "#E57373" : textSecondary}
              />
            }
            onPress={onFavoritePress}
            variant="outlined"
            hapticType={isFavorite ? "light" : "success"}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    paddingTop: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  rightOverlay: {
    alignItems: "flex-end",
    paddingRight: Spacing.xl,
  },
  leftOverlay: {
    alignItems: "flex-start",
    paddingLeft: Spacing.xl,
  },
  overlayBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  word: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    fontFamily: "Georgia",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  pronunciation: {
    marginBottom: Spacing.lg,
  },
  definition: {
    fontSize: FontSizes.lg,
    textAlign: "center",
    lineHeight: 26,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
