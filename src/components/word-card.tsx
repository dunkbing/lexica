import React, { useCallback, useRef } from "react";
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
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface WordCardProps {
  word: Word;
  onSwipeRight: () => void; // User knows
  onSwipeLeft: () => void; // Need to review
  onInfoPress: () => void;
  onFavoritePress: () => void;
  onSavePress: () => void;
  onSharePress: () => void;
  isFavorite: boolean;
  isSaved: boolean;
}

export function WordCard({
  word,
  onSwipeRight,
  onSwipeLeft,
  onInfoPress,
  onFavoritePress,
  onSavePress,
  onSharePress,
  isFavorite,
  isSaved,
}: WordCardProps) {
  const { t, i18n } = useTranslation();
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  const backgroundColor = useThemeColor({}, "wordCardBg");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const primaryColor = useThemeColor({}, "primary");
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

  const resetCard = useCallback(() => {
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
    rotation.value = withSpring(0, { damping: 15 });
    scale.value = withSpring(1, { damping: 15 });
    hasTriggeredHaptic.current = false;
  }, [translateX, translateY, rotation, scale]);

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

      // Trigger haptic when crossing threshold
      if (
        Math.abs(event.translationX) > SWIPE_THRESHOLD &&
        !hasTriggeredHaptic.current
      ) {
        hasTriggeredHaptic.current = true;
        if (event.translationX > 0) {
          runOnJS(triggerHaptic)("success");
        } else {
          runOnJS(triggerHaptic)("warning");
        }
      } else if (Math.abs(event.translationX) < SWIPE_THRESHOLD) {
        hasTriggeredHaptic.current = false;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(30, { duration: 300 });
        runOnJS(handleSwipeComplete)("right");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(-30, { duration: 300 });
        runOnJS(handleSwipeComplete)("left");
      } else {
        runOnJS(resetCard)();
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor, borderColor },
          animatedStyle,
        ]}
      >
        {/* Know overlay */}
        <Animated.View style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}>
          <View style={[styles.overlayBadge, { backgroundColor: successColor }]}>
            <IconSymbol name="checkmark" size={24} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Review overlay */}
        <Animated.View style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}>
          <View style={[styles.overlayBadge, { backgroundColor: warningColor }]}>
            <IconSymbol name="arrow.counterclockwise" size={24} color="#FFFFFF" />
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
              icon={<IconSymbol name="speaker.wave.2.fill" size={16} color={textSecondary} />}
              style={styles.pronunciation}
            />
          </TouchableOpacity>

          {/* Definition */}
          <Text style={[styles.definition, { color: textColor }]}>
            {posLabel} {word.definition_en}
          </Text>

          {/* Vietnamese meaning */}
          <Text style={[styles.meaning, { color: primaryColor }]}>
            {word.meaning_vi}
          </Text>

          {/* Example */}
          {word.examples[0] && (
            <View style={styles.exampleContainer}>
              <Text style={[styles.example, { color: textSecondary }]}>
                "{word.examples[0].en}"
              </Text>
              <Text style={[styles.exampleTranslation, { color: textSecondary }]}>
                {word.examples[0].vi}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <IconButton
            icon={<IconSymbol name="info.circle" size={24} color={textSecondary} />}
            onPress={onInfoPress}
            variant="outlined"
          />
          <IconButton
            icon={<IconSymbol name="square.and.arrow.up" size={24} color={textSecondary} />}
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
          <IconButton
            icon={
              <IconSymbol
                name={isSaved ? "bookmark.fill" : "bookmark"}
                size={24}
                color={isSaved ? primaryColor : textSecondary}
              />
            }
            onPress={onSavePress}
            variant="outlined"
            hapticType={isSaved ? "light" : "success"}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    minHeight: 400,
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
    justifyContent: "center",
    borderRadius: BorderRadius.xl,
  },
  rightOverlay: {
    alignItems: "flex-start",
    paddingLeft: Spacing.xl,
  },
  leftOverlay: {
    alignItems: "flex-end",
    paddingRight: Spacing.xl,
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
    marginBottom: Spacing.sm,
  },
  meaning: {
    fontSize: FontSizes.md,
    textAlign: "center",
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xl,
  },
  exampleContainer: {
    paddingHorizontal: Spacing.md,
  },
  example: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  exampleTranslation: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
