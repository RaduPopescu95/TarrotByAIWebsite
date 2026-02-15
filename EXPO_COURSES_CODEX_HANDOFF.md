# Expo Courses + Stripe Handoff (Copy/Paste)

Folosește acest document ca input direct pentru Codex în celălalt proiect React Native Expo.

## Prompt gata de dat lui Codex

```md
Implementează integrarea pentru cursuri video + achiziții Stripe folosind backend-ul existent (nu scrie backend nou, nu accesa direct Firestore din app pentru purchase flow).

## Constrângeri
- Stack: React Native Expo + TypeScript.
- Toate request-urile merg către backend-ul web existent (Next API routes).
- Pentru endpoint-urile protejate, trimite `Authorization: Bearer <Firebase ID Token>`.
- Nu folosi chei Stripe client-side.
- După checkout, revino pe deep link în app și reîncarcă entitlement-ul.
- App-ul are localizare; conținutul cursurilor trebuie afișat în limba selectată în aplicație.

## Endpoint-uri backend existente
1. `GET /api/courses?locale=ro&featuredOnly=true|false&limit=20`
2. `GET /api/courses/home?locale=ro`
3. `GET /api/courses/:courseId?locale=ro` (opțional auth; răspunde cu `course`, `isVisible`, `hasAccess`)
4. `POST /api/stripe/courses/create-checkout-session` (auth required)
5. `GET /api/courses/purchased?locale=ro` (auth required)
6. `GET /api/courses/:courseId/playback` (auth required + purchase paid)

## Localizare (obligatoriu)
- Ia limba activă din sistemul de localizare al app-ului (ex: `i18n.language` / store-ul de limbă).
- Normalizează limba pentru backend ca cod scurt (`ro`, `en`, `fr`, `it`, etc; lowercase).
- Trimite `locale` în query pentru:
  - `GET /api/courses`
  - `GET /api/courses/home`
  - `GET /api/courses/:courseId`
  - `GET /api/courses/purchased`
- La schimbarea limbii în app, fă refetch pentru datele de cursuri ca să se reafișeze conținutul în noua limbă.
- Pentru titlu/descriere/notes/contact afișează valorile primite din API (deja localizate server-side), nu le suprascrie local.
- Backend-ul are fallback server-side (limba cerută -> `ro` -> câmpuri default), deci păstrează acest comportament și în client.

## Firestore model real (pentru referință, nu citi direct din app pentru checkout flow)
- `courses/{courseId}`: metadate curs, preview, curriculum, notes/contact.
- `courseMedia/{courseId}`: `vimeoUrl`, `vimeoId` (privat).
- `users/{uid}/purchases/{courseId}`: entitlement/status plată.
- `courseCheckoutSessions/{stripeSessionId}`, `payments/{stripeSessionId}`, `stripeWebhookEvents/{eventId}`: audit/checkout/webhook.

## Ce vreau să implementezi în app
1. Creează `src/types/courses.ts` cu tipurile de mai jos.
2. Creează `src/services/coursesApi.ts` cu un client API robust (error handling + auth opțional/obligatoriu).
3. Creează `src/features/courses/useCourses.ts` (hook pentru list/detail/purchased/playback/checkout).
4. Integrează checkout cu `expo-web-browser` + deep link:
   - cere session prin `POST /api/stripe/courses/create-checkout-session`
   - deschide `url` Stripe
   - folosește `successUrl` și `cancelUrl` pe deep link (ex: `myapp://courses/:id?success=1`)
   - la revenire, dă refetch la `/api/courses/:id` și `/api/courses/:id/playback` dacă are access.
5. Adaugă config clar:
   - `EXPO_PUBLIC_API_BASE_URL`
   - `MOBILE_DEEP_LINK_ALLOWED_PREFIXES` deja configurat pe backend să accepte schema app.
6. Leagă explicit datele de cursuri de limba activă:
   - hook-urile de list/home/detail/purchased primesc `locale` din app state
   - la schimbarea limbii se invalidează cache-ul și se refac request-urile.

## UI / JSX parity (obligatoriu)
Implementează UI-ul pe 3 ecrane astfel încât experiența să fie echivalentă cu site-ul curent (nu trebuie copiat Tailwind, dar structura și stările trebuie păstrate).

### 1) Courses List Screen (`/courses`)
- Hero/header section:
  - titlu + subtitlu
  - CTA către „Purchased courses”.
- Stări:
  - loading text
  - error banner
  - empty state card.
- Grid de carduri adaptive (1 col pe mobil, mai multe pe ecrane mari).
- Card curs (echivalent `CourseCard`):
  - zonă media sus:
    - dacă există preview video (`previewVimeoId`) și nu există custom thumbnail: afișează preview Vimeo embedded (fără controale vizibile),
    - altfel thumbnail image,
    - altfel placeholder „no image”.
  - badge featured (dacă există).
  - title + short description.
  - footer cu preț formatat după locale + CTA „Open”.
  - apăsarea cardului deschide detail.

### 2) Course Detail Screen (`/courses/:id`)
- Top bar:
  - buton back la listă,
  - chip cu preț,
  - link către purchased.
- Bannere:
  - success/canceled după checkout return,
  - checkout error banner.
- Layout 2 coloane (main + sidebar pe ecrane mari; stack pe mobil).
- Zona video (echivalent `VideoCard`):
  - dacă `hasAccess=true`:
    - loading playback,
    - error playback,
    - player Vimeo cu `playbackVimeoId`,
    - fallback „playback unavailable”.
  - dacă `hasAccess=false`:
    - thumbnail preview sau preview video sau fallback text,
    - overlay play icon pe preview lock-uit.
- Card de conținut:
  - title + subtitle.
  - tabs: Materials / Notes / Contact.
  - acțiuni: Add to calendar + Share.
  - mesaj temporar de feedback la Share.
  - în tab Materials:
    - lesson card (title + duration),
    - section summary,
    - empty state dacă nu există lesson.
  - în tab Notes/Contact:
    - conținut localizat din API cu fallback text dacă lipsește.
- Access/purchase box (logică obligatorie):
  - `!isVisible && !hasAccess`: unavailable / pending messages.
  - `hasAccess`: access granted banner.
  - altfel:
    - dacă user logat: buton „Purchase” (disabled/loading state),
    - dacă user nelogat: login/register CTAs + hint.
- Indicator „access checking” când se face polling după checkout.
- Sidebar curriculum (echivalent `SidebarCurriculum`):
  - titlu + progress,
  - listă lecții tip accordion (open/close),
  - status icon completed/not completed,
  - final test card,
  - certificate card disabled până la access.

### 3) Purchased Courses Screen (`/courses/purchased`)
- Guard de auth:
  - dacă nu e logat, redirect la login cu returnUrl.
- Header:
  - title + subtitle,
  - buton „Browse courses”.
- Stări:
  - loading
  - error banner
  - empty state cu CTA.
- Lista de purchase cards:
  - imagine thumbnail sau placeholder.
  - title + description.
  - badge „unavailable” dacă course lipsă.
  - metadata: purchasedAt + amountPaid formatate cu locale.
  - buton „Open course” dacă există cursul, altfel mesaj fallback.

### Componente recomandate în Expo
- `CourseListScreen`
- `CourseCard`
- `CourseDetailScreen`
- `CourseVideoCard`
- `CourseTabs`
- `CourseMaterialsPanel`
- `CourseSidebarCurriculum`
- `PurchasedCoursesScreen`

## Tipuri (folosește exact contractul ăsta)
```ts
export type CourseCurrency = "RON" | "EUR";
export type CourseStatus = "draft" | "published" | "scheduled";

export interface CourseCurriculumLesson {
  id: string;
  title: string;
  durationMinutes: number | null;
  summary: string;
  isCompleted: boolean;
  order: number;
}

export interface SafeCourse {
  id: string;
  title: string;
  description: string;
  categoryIds: string[];
  price: number;
  currency: CourseCurrency;
  status: CourseStatus;
  featuredOnHome: boolean;
  scheduledAt: string | null;
  hasCustomThumbnail: boolean;
  thumbnailUrl: string | null;
  hasVimeoPreview: boolean;
  previewVimeoId: string | null;
  updatedAt: string | null;
}

export interface SafeCourseDetail extends SafeCourse {
  curriculumLessons: CourseCurriculumLesson[];
  notesContent: string;
  contactContent: string;
}

export interface CourseStateResponse {
  course: SafeCourseDetail;
  isVisible: boolean;
  hasAccess: boolean;
}

export interface CoursesHomeResponse {
  latestCourses: SafeCourse[];
  featuredCourses: SafeCourse[];
}

export interface CoursesListResponse {
  courses: SafeCourse[];
}

export interface PurchasedCourseItem {
  courseId: string;
  status: string;
  purchasedAt: string | null;
  amountPaid: number;
  currency: string;
  courseMissing: boolean;
  course: SafeCourse | null;
}

export interface PurchasedCoursesResponse {
  purchases: PurchasedCourseItem[];
}

export interface PlaybackResponse {
  provider: "vimeo";
  vimeoId: string;
}

export interface BillingDetails {
  billingType?: "individual" | "corporate";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  company?: {
    name?: string;
    vat?: string;
    reg?: string;
    address?: string;
  };
  invoicePreferences?: {
    sendEmail?: boolean;
    eInvoice?: boolean;
    dueDays?: number | null;
  };
}

export interface CreateCheckoutSessionRequest {
  courseId: string;
  successUrl?: string;
  cancelUrl?: string;
  platform?: string; // "expo"
  billingDetails?: BillingDetails;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}
```

## Service API (implementare)
- Creează o clasă/factory cu:
  - `listCourses(params)`
  - `homeCourses(locale?)`
  - `getCourseState(courseId, locale?)`
  - `createCheckoutSession(payload)` (auth required)
  - `getPurchasedCourses(locale?)` (auth required)
  - `getPlayback(courseId)` (auth required)
- Trimite `Authorization` doar când este necesar.
- Aruncă erori standardizate cu `status` + `message`.
- Pentru endpoint-urile cu localizare, transmite mereu `locale` (din limba activă a app-ului).

## Important
- Nu schimba contractele backend.
- Nu inventa endpoint-uri noi.
- La final, returnează lista de fișiere create/modificate + un scurt usage example în ecranul de course detail.
```

---

## Fișier gata de copiat: `src/services/coursesApi.ts`

```ts
import type {
  CourseStateResponse,
  CoursesHomeResponse,
  CoursesListResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PlaybackResponse,
  PurchasedCoursesResponse,
} from "../types/courses";

type Primitive = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface CoursesApiConfig {
  baseUrl: string;
  getIdToken?: () => Promise<string | null>;
}

export interface ListCoursesParams {
  locale?: string;
  featuredOnly?: boolean;
  limit?: number;
}

function buildQuery(params: Record<string, Primitive>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const out = query.toString();
  return out ? `?${out}` : "";
}

export function createCoursesApi(config: CoursesApiConfig) {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  async function request<T>(
    path: string,
    init: RequestInit = {},
    opts: { auth?: boolean } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };

    if (opts.auth) {
      const token = (await config.getIdToken?.()) || null;
      if (!token) throw new ApiError("Missing auth token", 401);
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    const payload =
      response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (payload as { error?: string } | null)?.error ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  return {
    listCourses(params: ListCoursesParams = {}) {
      const query = buildQuery({
        locale: params.locale,
        featuredOnly:
          typeof params.featuredOnly === "boolean"
            ? params.featuredOnly
            : undefined,
        limit: params.limit,
      });
      return request<CoursesListResponse>(`/api/courses${query}`, {
        method: "GET",
      });
    },

    homeCourses(locale?: string) {
      const query = buildQuery({ locale });
      return request<CoursesHomeResponse>(`/api/courses/home${query}`, {
        method: "GET",
      });
    },

    getCourseState(courseId: string, locale?: string) {
      const query = buildQuery({ locale });
      return request<CourseStateResponse>(
        `/api/courses/${encodeURIComponent(courseId)}${query}`,
        { method: "GET" },
        { auth: false }
      );
    },

    createCheckoutSession(payload: CreateCheckoutSessionRequest) {
      return request<CreateCheckoutSessionResponse>(
        "/api/stripe/courses/create-checkout-session",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { auth: true }
      );
    },

    getPurchasedCourses(locale?: string) {
      const query = buildQuery({ locale });
      return request<PurchasedCoursesResponse>(
        `/api/courses/purchased${query}`,
        { method: "GET" },
        { auth: true }
      );
    },

    getPlayback(courseId: string) {
      return request<PlaybackResponse>(
        `/api/courses/${encodeURIComponent(courseId)}/playback`,
        { method: "GET" },
        { auth: true }
      );
    },
  };
}
```

---

## Exemplu checkout Expo (scurt)

```ts
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

async function startCheckout(courseId: string) {
  const successUrl = Linking.createURL(`/courses/${courseId}`, {
    queryParams: { success: "1" },
  });
  const cancelUrl = Linking.createURL(`/courses/${courseId}`, {
    queryParams: { canceled: "1" },
  });

  const { url } = await coursesApi.createCheckoutSession({
    courseId,
    platform: "expo",
    successUrl,
    cancelUrl,
  });

  await WebBrowser.openBrowserAsync(url);
  // după revenire pe deep link: refetch course state + playback
}
```
