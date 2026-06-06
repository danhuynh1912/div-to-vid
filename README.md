# DivToVid — AI Video Search

Search any topic and let AI do the rest. DivToVid scans YouTube and the open web, then uses Gemini to rank every result by relevance — surfacing the most accurate videos across any keyword.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **AI Ranking:** Google Gemini Flash (structured JSON output)
- **Video Sources:** YouTube Data API v3 · Serper.dev · SerpAPI (fallback)
- **Download:** yt-dlp command generation

## Getting started

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

## Environment variables

```env
# Required
YOUTUBE_API_KEY=       # Google Cloud → YouTube Data API v3
GEMINI_API_KEY=        # Google AI Studio → Gemini Flash

# Web search (priority order)
SERPER_API_KEY=        # serper.dev — 2,500 free searches
SERPAPI_KEY=           # serpapi.com — 100 free trial searches (fallback)

# Optional
USE_MOCK_FALLBACK=false   # true = fall back to mock data on API errors
GOOGLE_CSE_CX=            # Google Custom Search Engine ID
GOOGLE_CSE_API_KEY=       # API key for CSE
BRAVE_API_KEY=            # Brave Search API (paid)
```

All keys fall back gracefully — the app runs without any web search keys (YouTube only).

## How it works

```
Keyword
  ↓
YouTube API + Web Search (Serper → SerpAPI)   ← in parallel
  ↓
Deduplicate by URL
  ↓
Gemini Flash semantic ranking (score 0–100)
  ↓
Sort: web results first, YouTube last
  ↓
Return top 50 ranked results
```

## API routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scan` | Run the full pipeline, return ranked videos |
| `POST` | `/api/download` | Generate a yt-dlp download command for a URL |
| `GET` | `/api/quota` | View current quota usage per provider |
