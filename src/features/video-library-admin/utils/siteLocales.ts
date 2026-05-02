// eslint-disable-next-line @typescript-eslint/no-require-imports
const cfg = require("../../../../next-i18next.config.js");

/** Same locale ids as Next.js i18n (single source via next-i18next config). */
export const SITE_LOCALES: string[] = [...cfg.i18n.locales];
