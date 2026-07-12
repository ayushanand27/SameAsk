# SameAsk

**Right AI. Right time.**

Tell us the job → get a shortlist → prove chat models stay consistent.

People drown in tabs (ChatGPT, Claude, Gemini, Arena, Cursor…). Labs fight over who is smartest. SameAsk answers a simpler question: *what should you use for this need — and will it hold still?*

## Product

1. **Find** — four questions → ranked shortlist (chat / coding / image / video / data / notes / aggregators) with when-to-use + next step  
2. **Market** — searchable curated directory  
3. **Live test** — same prompt × N runs → consistency score (BYOK or demo)

### Free / testing

- No keys → **demo mode**
- Paste **OpenRouter** (or provider) keys in the UI → real runs  
- Keys stay in **browser localStorage** only

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

## Why this exists

Directories list tools. Leaderboards crown vibes. SameAsk matches **need → tool**, then measures **reliability on your prompt**.
