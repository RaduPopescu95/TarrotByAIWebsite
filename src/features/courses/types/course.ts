export type CourseCurrency = "RON" | "EUR";
export type CourseStatus = "draft" | "published" | "scheduled";

export interface CourseLocaleCurriculumLesson {
  id: string;
  title?: string;
  summary?: string;
}

export interface CourseLocaleFields {
  title: string;
  description?: string;
  notesContent?: string;
  contactContent?: string;
  curriculumLessons?: CourseLocaleCurriculumLesson[];
}

export type CourseLocales = Record<string, CourseLocaleFields>;

export type CourseCategoryLocales = Record<string, string>;

export interface CourseCurriculumLesson {
  id: string;
  title: string;
  durationMinutes: number | null;
  summary: string;
  isCompleted: boolean;
  order: number;
}

export interface CourseBase {
  title: string;
  description: string;
  vimeoUrl: string;
  vimeoId?: string | null;
  categoryIds?: string[];
  price: number;
  currency: CourseCurrency;
  status: CourseStatus;
  featuredOnHome?: boolean;
  vimeoPreviewThumbnailUrl?: string | null;
  vimeoPreviewVideoId?: string | null;
  hasVimeoPreview?: boolean;
  hasCustomThumbnail?: boolean;
  previewVimeoId?: string | null;
  scheduledAt?: unknown;
  locales?: CourseLocales;
  thumbnailUrl?: string | null;
  curriculumLessons?: CourseCurriculumLesson[];
  notesContent?: string;
  contactContent?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

export interface CourseDoc extends CourseBase {
  id: string;
}

export interface CourseCategoryDoc {
  id: string;
  name: string;
  locales?: CourseCategoryLocales;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

export type CourseCreateInput = Omit<CourseBase, "createdAt" | "updatedAt">;
export type CourseUpdateInput = Partial<CourseCreateInput>;

export interface PurchaseDoc {
  courseId: string;
  stripeCheckoutSessionId: string;
  purchasedAt: unknown;
  amountPaid: number;
  currency: string;
  status: "paid";
}
