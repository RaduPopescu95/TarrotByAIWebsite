This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Payments maintenance mode (Stripe)

You can temporarily disable Stripe checkout session creation (both individual consultations and group conferences) while doing maintenance/testing.

### Environment variables

- `PAYMENTS_MAINTENANCE_ENABLED`: `true` or `false`
- `PAYMENTS_MAINTENANCE_KEY`: a long random string used as a bypass password via URL query param
- `NEXT_PUBLIC_PAYMENTS_MAINTENANCE_ENABLED`: `true` or `false` (optional, used only to show the maintenance banner in the UI without calling the API)

### How it works

- When maintenance is enabled, the API endpoints will return `503` unless a correct bypass key is provided:
  - `/api/create-checkout-session?maintenance_key=...`
  - `/api/create-checkout-session-conferinta?maintenance_key=...`

- To bypass in the browser during testing, open the checkout page with:
  - `?maintenance_key=<PAYMENTS_MAINTENANCE_KEY>`

Users without the key will see a maintenance message and will be prevented from starting payment.

## Ads orchestration (policy-first)

This project uses a centralized multi-network ad orchestration layer:

- Route and slot policy: `lib/ads/config.js`
- Env parsing and toggles: `lib/ads/env.js`
- Provider resolution per route: `lib/ads/orchestrator.js`
- Runtime script loader: `components/Ads/AdsProviderScripts.jsx`
- Slot renderer: `components/Ads/AdSlot.jsx`

### Environment variables

- `NEXT_PUBLIC_ADS_ENABLED`: `true` or `false`
- `NEXT_PUBLIC_PRIMARY_AD_PROVIDER`: `adsense`, `monetag`, or `adsterra`
- `NEXT_PUBLIC_ADS_CONSENT_REQUIRED`: `true` or `false` (default expected: `true`)

AdSense:

- `NEXT_PUBLIC_ENABLE_ADSENSE`: `true` or `false`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID`: your `ca-pub-...` client id
- `NEXT_PUBLIC_ADSENSE_SLOT_AFTER_HERO`: slot id used by the `after-hero` placement
- `NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED`: slot id used by the `in-feed` placement

Monetag:

- `NEXT_PUBLIC_ENABLE_MONETAG`: `true` or `false`
- `NEXT_PUBLIC_MONETAG_ZONE_ID`: Monetag zone id
- `NEXT_PUBLIC_MONETAG_FORMAT`: default `inpage_push` (intrusive formats are blocked)
- `NEXT_PUBLIC_MONETAG_SCRIPT_SRC`: optional explicit script source (overrides derived URL)

Adsterra (prepared, disabled by default):

- `NEXT_PUBLIC_ENABLE_ADSTERRA`: `true` or `false` (default expected: `false`)
- `NEXT_PUBLIC_ADSTERRA_SCRIPT_SRC`: explicit script source

### Compliance guardrails

- Ads render only on explicitly allowed public content routes and slot placements.
- Ads are blocked on sensitive/private/transactional routes.
- Intrusive secondary formats are blocked (`popunder`, `onclick`, `smartlink`).
- When consent is required, ad scripts are loaded only after valid CMP consent is available via TCF API (`window.__tcfapi`).
