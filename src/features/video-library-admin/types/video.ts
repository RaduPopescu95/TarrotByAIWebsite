import type { Timestamp } from "firebase/firestore";

export type VideoPlatform = "bunny" | "vimeo" | "youtube";
export type VideoNotificationState = "pending" | "sent";

export type VideoLocaleFields = {
  title: string;
  description?: string;
  /** Per-language playback URL when platform differs per locale (e.g. Bunny). */
  videoUrl?: string;
};

export type VideoLocales = Record<string, VideoLocaleFields>;
export type VideoCategoryLocales = Record<string, string>;
export type VideoSortField =
  | "createdAt"
  | "publishAt"
  | "title"
  | "order"
  | "platform"
  | "category"
  | "isPublished";

export type VideoSortDirection = "asc" | "desc";

export type VideoDoc = {
  id: string;
  title: string;
  description?: string;
  platform: VideoPlatform;
  /** Legacy / denormalized; used when no locales.*.videoUrl exist. */
  videoUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp;
  publishAt?: Timestamp | null;
  isPublished: boolean;
  notificationState?: VideoNotificationState;
  notificationSentAt?: Timestamp | null;
  isPremium?: boolean;
  order?: number | null;
  durationSeconds?: number | null;
  locales?: VideoLocales;
  featuredOnHome?: boolean;
};

export type VideoCategoryDoc = {
  id: string;
  name: string;
  slug?: string;
  createdAt: Timestamp;
  locales?: VideoCategoryLocales;
};

export type VideoCreateInput = {
  title: string;
  description?: string;
  platform: VideoPlatform;
  /** Denormalized; derived from locales on save when possible. */
  videoUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  publishAt?: Timestamp | null;
  isPublished?: boolean;
  isPremium?: boolean;
  order?: number;
  durationSeconds?: number;
  locales?: VideoLocales;
  featuredOnHome?: boolean;
};

export type VideoUpdateInput = Partial<VideoCreateInput>;

export interface Video extends VideoDoc {
  id: string;
}
