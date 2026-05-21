import Script from "next/script";

export default function MonetagScript({ scriptSrc, shouldLoad }) {
  if (!scriptSrc || !shouldLoad) return null;

  return (
    <Script
      id="monetag-script"
      async
      strategy="afterInteractive"
      src={scriptSrc}
      data-cfasync="false"
    />
  );
}
