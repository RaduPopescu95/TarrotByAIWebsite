import { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import { GA_MEASUREMENT_ID, isGaEnabled, pageview } from "../lib/gtag";

export default function GoogleAnalytics() {
  const router = useRouter();

  useEffect(() => {
    if (!isGaEnabled() || !router.isReady) return undefined;

    const handleRouteChange = (url) => {
      pageview(url);
    };

    handleRouteChange(router.asPath);
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.isReady, router.events]);

  if (!isGaEnabled()) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
