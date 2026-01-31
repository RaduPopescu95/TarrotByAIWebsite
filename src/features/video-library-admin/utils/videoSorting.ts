import type { Timestamp } from "firebase/firestore";
import type { VideoDoc } from "../types/video";

function toMs(value?: Timestamp | null): number {
  if (!value) return 0;
  try {
    if (typeof (value as Timestamp).toDate === "function") {
      return (value as Timestamp).toDate().getTime();
    }
    const anyVal = value as unknown as { seconds?: number };
    if (typeof anyVal?.seconds === "number") {
      return anyVal.seconds * 1000;
    }
  } catch (_) {}
  return 0;
}

export function sortVideos(items: VideoDoc[]): VideoDoc[] {
  return [...items].sort((a, b) => {
    const aHasOrder = typeof a.order === "number";
    const bHasOrder = typeof b.order === "number";
    if (aHasOrder && bHasOrder) {
      if ((a.order as number) !== (b.order as number)) {
        return (a.order as number) - (b.order as number);
      }
    } else if (aHasOrder !== bHasOrder) {
      return aHasOrder ? -1 : 1;
    }
    return toMs(b.createdAt) - toMs(a.createdAt);
  });
}
