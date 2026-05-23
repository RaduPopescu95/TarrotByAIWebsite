import Script from "next/script";

export default function MonetagScript({ scriptSrc, zoneId, shouldLoad }) {
  if (!scriptSrc || !shouldLoad) return null;

  return (
    <Script
      id="monetag-script"
      async
      strategy="afterInteractive"
      src={scriptSrc}
      data-zone={zoneId || undefined}
      data-cfasync="false"
    />
  );
}
