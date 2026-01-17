import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";

const REVIEW_REQUESTED_KEY = "hasRequestedReview";
const PRACTICE_COUNT_KEY = "practiceSessionCount";
const MIN_PRACTICE_SESSIONS_BEFORE_REVIEW = 7;

const APP_STORE_URL =
  "https://apps.apple.com/app/id6746691565?action=write-review";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=kanaji.db99.dev";

/**
 * Request an in-app review if available, otherwise open the store page.
 * Use this for manual review requests (e.g., from settings).
 */
export async function requestReview(): Promise<void> {
  if (await StoreReview.hasAction()) {
    await StoreReview.requestReview();
  } else {
    // Fallback to opening store URL
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url);
  }
}

/**
 * Call this after completing a practice session.
 * Increments practice count and shows review prompt after reaching threshold.
 * Will only show the prompt once.
 */
export async function maybeRequestReview(): Promise<boolean> {
  try {
    // Don't ask if already requested
    const hasRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
    if (hasRequested === "true") {
      return false;
    }

    // Increment practice session count
    const countStr = await AsyncStorage.getItem(PRACTICE_COUNT_KEY);
    const count = parseInt(countStr || "0", 10) + 1;
    await AsyncStorage.setItem(PRACTICE_COUNT_KEY, String(count));

    // Only ask after minimum practice sessions
    if (count < MIN_PRACTICE_SESSIONS_BEFORE_REVIEW) {
      return false;
    }

    // Check if the review API is available
    if (!(await StoreReview.hasAction())) {
      return false;
    }

    // Request review
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, "true");
    return true;
  } catch (error) {
    console.error("[store-review] Error requesting review:", error);
    return false;
  }
}
