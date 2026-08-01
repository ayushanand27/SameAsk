# SameAsk

**Right AI. Right time.**

Market-ready product to close the gap between “which model is smartest?” and “which tool fits my need — and will answers hold still on my prompt?”

## Product

1. **Find** — four questions → ranked shortlist (chat, coding, image, video, data, notes, PPT, resume/ATS, aggregators)
2. **Market** — searchable curated directory
3. **Live test** — same prompt × N runs → **answer similarity** (semantic embeddings when keys allow + lexical blend)

### Production attributes

- Transparent [methodology](https://sameask.vercel.app/methodology), [privacy](https://sameask.vercel.app/privacy), and [terms](https://sameask.vercel.app/terms)
- Pairwise min / max / σ, confidence note by sample size
- Temperature control, cancel in-flight runs, parallel per-model calls
- Export Markdown / CSV / JSON, copy summary, share, local history
- Side-by-side run compare · max 8 models · 4k prompt cap
- Simple / Technical view modes
- BYOK (OpenRouter recommended); demo mode without keys
- Guided OpenRouter onboarding + free-friendly model preset
- In-product streaming feedback chat (Groq + Sarvam mix with failover)
- Security headers, sitemap/robots, health check `/api/health`

### What it is not

Answer similarity ≠ quality, factual accuracy, or Arena Elo.

## Run locally

```bash
npm install
npm run dev
```

Optional `.env.local`:

```
OPENROUTER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=
```

Live: https://sameask.vercel.app  
Repo: https://github.com/ayushanand27/SameAsk
