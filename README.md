# DivToVid — Divs to Vids Engine

Premium **Multimodal Video Crawler & AI Filtering Machine**. Enter a semantic keyword, and DivToVid discovers videos across YouTube, TikTok, and X (Twitter), then uses **Google Gemini Flash** to surface the **Top 3 most accurate matches** with a direct download option powered by `yt-dlp`.

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **AI Layer**: Google Gemini 2.0 Flash (JSON-mode structured ranking)
- **Discovery**: YouTube Data API v3 + Mock scrapers for TikTok & X
- **Download**: yt-dlp command generation (server-side)

## Setup

```bash
npm install
# Edit .env.local with your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key |
| `GEMINI_API_KEY` | Google Gemini API key (Gemini 2.0 Flash) |

Both keys fall back gracefully to mock data if missing — fully functional for demo without keys.

## Pipeline

```
Keyword → [YouTube + TikTok Mock + Twitter Mock] → 15 candidates
       → Gemini Flash semantic scoring (0-100)
       → Top 3 results with yt-dlp download
```

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/scan` | Full pipeline → top 3 ranked videos |
| POST | `/api/download` | yt-dlp command generation for a URL |
