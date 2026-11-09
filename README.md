# ForgeSSB

AI-powered SSB (Services Selection Board) preparation app — WAT/SRT practice and full tests, journey curriculum, and leaderboard. Built with React 19, Vite, TanStack Router, and Supabase.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | From your Supabase project's Settings → API. The app crashes on load without this — the Supabase client is created at import time (`src/lib/supabase.ts`). |
| `VITE_SUPABASE_ANON_KEY` | Yes | Same page as above. |
| `ANTHROPIC_API_KEY` | Yes, for AI-scored tests | Server-side only (no VITE_ prefix). Used by `api/claude.ts` to score WAT/SRT responses. |
| `VITE_RAZORPAY_KEY_ID` | No | Omit in dev — `src/routes/pricing.tsx` falls back to writing a mock active purchase so you can test paid-tier flows without real payments. |

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and production build (`dist/`)
- `npm run lint` — ESLint
- `npm run preview` — preview the production build locally
