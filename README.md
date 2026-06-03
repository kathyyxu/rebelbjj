# Rebel BJJ

我的柔术进化地图: an OKX wallet-integrated BJJ training platform with private training logs, Solana milestone proofs, and coach-certified belt promotion moments.

## Demo

- Demo video: https://www.youtube.com/watch?v=hhNkXFIhmZ8&t=63s
- Live app: https://phantom-thief-s-mat-main.vercel.app/

## Hackathon

Built for Build with XAgent x OKX.

## Deploy (production only)

Always deploy to the linked Vercel project **`phantom-thief-s-mat-main`** (production URL above). Do not use the separate `rebelbjj` Vercel project alias.

```bash
npx vercel link --project phantom-thief-s-mat-main --yes
npx vercel deploy --prod --yes
```

## AI coach training plan (hybrid LLM)

The training plan uses the **rule engine** for structure (sections, drills, duration, intensity) and an optional **LLM layer** for coach copy (`opening`, `closing`, personalization bullets, section notes). If the API is missing, misconfigured, or fails, the app **falls back to rules only**.

### Vercel environment variables

Set these on project **`phantom-thief-s-mat-main`** (Settings → Environment Variables):

| Variable | Purpose |
|----------|---------|
| `TRAINING_PLAN_LLM_PROVIDER` | `gemini` (default), `openai`, `groq`, `openrouter`, or `xai` |
| `TRAINING_PLAN_LLM_API_KEY` | Optional shared key (overrides provider-specific keys) |
| `GEMINI_API_KEY` | Google Gemini (default provider) |
| `OPENAI_API_KEY` | OpenAI |
| `GROQ_API_KEY` | Groq |
| `OPENROUTER_API_KEY` | OpenRouter |
| `XAI_API_KEY` | xAI Grok |

Optional model overrides: `GEMINI_MODEL`, `OPENAI_MODEL`, `GROQ_MODEL`, `OPENROUTER_MODEL`, `XAI_MODEL`.

Endpoint: `POST /api/training/generate-plan` (see `api/training/generate-plan.ts`).

Local `npm run dev` serves the SPA only; LLM enhancement works when deployed to Vercel or when using `npx vercel dev`.

## Layout

- `anchor/` - Solana Program in Rust + Anchor, meant for devnet deployment
- `backend/` - auxiliary Rust API for off-chain demo logic and indexing
- `api/` and `rust-api/` - Vercel Rust functions kept for lightweight demo endpoints
- `src/` - React frontend
