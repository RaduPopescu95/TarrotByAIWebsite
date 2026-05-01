import type { Timestamp } from "firebase/firestore";

export type VideoPlatform = "bunny" | "vimeo" | "youtube";

export type VideoLocaleFields = {
  title: string;
  description?: string;
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
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp;
  publishAt?: Timestamp | null;
  isPublished: boolean;
  isPremium?: boolean;
  order?: number | null;
  durationSeconds?: number | null;
  locales?: VideoLocales;
};

export type VideoCategoryDoc = {
  id: string;
  name: string;
  createdAt: Timestamp;
  locales?: VideoCategoryLocales;
};

export type VideoCreateInput = {
  title: string;
  description?: string;
  platform: VideoPlatform;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  publishAt?: Timestamp | null;
  isPublished?: boolean;
  isPremium?: boolean;
  order?: number;
  durationSeconds?: number;
  locales?: VideoLocales;
};

export type VideoUpdateInput = Partial<VideoCreateInput>;

export interface Video extends VideoDoc {
  id: string;
}
