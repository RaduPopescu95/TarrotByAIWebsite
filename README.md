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

## Ads orchestration (Adsterra Native Banner)

Primary monetization uses discrete Adsterra Native Banner slots on public pages (see `lib/ads/config.js` allowlist). AdSense Auto Ads is disabled when `NEXT_PUBLIC_ENABLE_ADSTERRA=true`.

- Route policy: `lib/ads/config.js`
- Slots: `components/Ads/AdPlacementShell.jsx` + `AdsterraSlot.jsx`
- Engagement gate: `components/Ads/useAdsEngagement.js` (5s delay, interaction, 5 pages/session)
- Consent: `useAdsConsent.js` when `NEXT_PUBLIC_ADS_CONSENT_REQUIRED=true` (Cookiebot marketing)

### Environment variables

- `NEXT_PUBLIC_ENABLE_ADSTERRA=true`
- `NEXT_PUBLIC_ADSTERRA_SCRIPT_HOST=//plXXXX.effectivegatecpm.com`
- `NEXT_PUBLIC_ADSTERRA_KEY_DEFAULT` (required)
- Optional per placement: `NEXT_PUBLIC_ADSTERRA_KEY_HOME`, `_ARTICLE`, `_VIDEO`, `_READING`

### Runtime behavior

- Banners load only in `production`, only on allowlisted routes, after engagement + consent.
- No popunder/interstitial formats in code.
- Middleware rate-limits automation UA on the same public routes.
- Dashboard preview: `/dashboard/ads-orchestration`

### Cloudflare hardening (recommended)

Apply these in Cloudflare dashboard for the same domain:

1. `Security > Bots`: enable Bot Fight Mode (or Super Bot Fight Mode if available).
2. `Security > WAF > Rate limiting`:
   - Rule A: path contains `/news` or `/videouri`
   - Threshold: start with `60 requests / 1 minute / IP`
   - Action: Managed Challenge.
3. `Security > WAF > Custom rules`:
   - Block obvious automation UAs (`curl`, `python-requests`, `wget`, headless agents).
4. `Analytics / Logs`: monitor sudden spikes by country/referrer/IP ASN and challenge/block those patterns.
