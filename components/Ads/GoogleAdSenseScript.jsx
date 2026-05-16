import Script from "next/script";
import { useRouter } from "next/router";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === "true";
const HIDE_ADSENSE_ON_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/signin",
  "/signup",
  "/settings",
  "/cont-client",
  "/panou-utilizator",
  "/meeting",
  "/meeting-admin",
  "/meeting-daily",
  "/meeting-agora",
];

export default function GoogleAdSenseScript() {
  const router = useRouter();
  const pathname = router?.pathname || "";
  const isProduction = process.env.NODE_ENV === "production";
  const shouldHideOnRoute = HIDE_ADSENSE_ON_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const shouldLoad =
    isProduction && ADSENSE_ENABLED && ADSENSE_CLIENT_ID && !shouldHideOnRoute;

  if (!shouldLoad) return null;

  return (
    <Script
      id="google-adsense"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
