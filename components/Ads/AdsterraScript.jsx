import Script from "next/script";

export default function AdsterraScript({ scriptSrc, shouldLoad }) {
  if (!scriptSrc || !shouldLoad) return null;

  return (
    <Script
      id="adsterra-script"
      async
      strategy="afterInteractive"
      src={scriptSrc}
    />
  );
}
