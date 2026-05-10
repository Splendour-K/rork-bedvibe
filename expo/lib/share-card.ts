import { Platform, Share, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { BedEntry } from "@/types";
import type { RefObject } from "react";

export async function shareEntry(
  entry: BedEntry,
  ref: RefObject<View | null> | null
): Promise<void> {
  const message = `I scored ${entry.score} on BedVibe today and earned the title "${entry.title}". ${entry.affirmation}`;

  if (Platform.OS === "web" || !ref?.current) {
    try {
      await Share.share({ message });
    } catch (e) {
      console.log("[share] fallback share error", e);
    }
    return;
  }

  try {
    const uri = await captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
    console.log("[share] captured", uri);
    await Share.share({ url: uri, message });
  } catch (e) {
    console.log("[share] capture failed, falling back", e);
    try {
      await Share.share({ message });
    } catch (e2) {
      console.log("[share] fallback also failed", e2);
    }
  }
}
