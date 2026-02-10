# Faza 5 QA + Rollout (Courses)

## Scope
- Dashboard admin: `http://localhost:3000/dashboard/courses`
- Public listing: `http://localhost:3000/courses`
- Public detail + purchase: `http://localhost:3000/courses/[courseId]`
- Stripe test mode + webhook: `POST /api/stripe/courses/webhook`

## Pre-Flight
1. Ruleaza app local:
```bash
npm run dev
```
2. Configureaza env minim:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET_COURSES`
- `NEXT_PUBLIC_SITE_URL` (sau fallback host local)
- `RAPIDAPI_TRANSLATE_KEY` (pentru Faza 4)
3. Ruleaza Stripe CLI (test mode) pentru webhook local:
```bash
stripe listen --forward-to localhost:3000/api/stripe/courses/webhook
```

## Test Matrix (10 scenarii)
| # | Scenariu | Pas rapid | Rezultat asteptat |
|---|---|---|---|
| 1 | `draft` in public | Creezi curs `draft` in dashboard, deschizi `/courses` + `/courses/[id]` | Nu apare in lista publica, detail returneaza `404` pentru user fara entitlement |
| 2 | `published` in public | Publici un curs | Apare in `/courses`, detail accesibil public |
| 3 | `scheduled` viitor | Setezi `scheduledAt` in viitor | Nu apare pana la data publicarii |
| 4 | `scheduled` trecut | Setezi `scheduledAt` in trecut | Apare in lista publica |
| 5 | Buy success | User logat, Stripe card test success (`4242...`) | Redirect success, webhook scrie entitlement, user vede playerul |
| 6 | Buy cancel | User anuleaza plata in Stripe Checkout | Redirect `?canceled=1`, cursul ramane locked |
| 7 | Paid vs unpaid | Compara user cu `purchase.status=paid` vs user fara purchase | Paid: playback `200`; unpaid: playback `403` |
| 8 | Categorie stearsa (in use/free) | In dashboard stergi categorie folosita si una libera | Folosita: `409`; libera: `204` |
| 9 | Eroare Stripe | Simulezi eroare (ex: card fail `4000 0000 0000 9995` sau secret invalid in env) | UI/API afiseaza eroare controlata, fara blocaj app |
| 10 | Curs depublicat dupa achizitie | User cumpara curs, apoi admin il trece `draft` | Userul platit pastreaza acces la detail + playback |

## Loguri Minime (adaugate)
- Checkout: tag `[courses.checkout]`
- Webhook: tag `[courses.webhook]`
- Entitlement (state + playback): tag `[courses.entitlement]`

Urmarire recomandata in timpul QA:
```bash
npm run dev | rg "courses\\.checkout|courses\\.webhook|courses\\.entitlement"
```

## Script de suport QA
Script pentru scenarii API automatizabile:
```bash
./scripts/test-courses-phase5.sh
```

Parametri utili:
- `BASE_URL`
- `PUBLISHED_COURSE_ID`
- `DRAFT_COURSE_ID`
- `SCHEDULED_FUTURE_COURSE_ID`
- `SCHEDULED_PAST_COURSE_ID`
- `PAID_AUTH_TOKEN`
- `UNPAID_AUTH_TOKEN`
- `ENTITLEMENT_COURSE_ID`
- `DEPUBLISHED_PAID_COURSE_ID`
- `DASHBOARD_TOKEN`

## Criteriu de acceptare final
- Zero blocaje in flow: `adauga curs -> publica -> cumpara -> acceseaza video`.
