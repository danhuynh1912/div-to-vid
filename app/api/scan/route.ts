import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";
import { searchTikTok, searchTwitter } from "@/lib/scrapers";
import { searchWeb } from "@/lib/web-search";
import { rankVideosWithGemini, RankedVideo } from "@/lib/gemini";

export interface ScanResponse {
  keyword: string;
  results: RankedVideo[];
  totalCandidates: number;
  sources: {
    youtube: number;
    tiktok_mock: number;
    twitter_mock: number;
    web_google_cse: number;
    web_brave: number;
    web_serpapi: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyword: string = (body.keyword ?? "").trim();

    if (!keyword || keyword.length < 2) {
      return NextResponse.json(
        { error: "Keyword must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (keyword.length > 200) {
      return NextResponse.json(
        { error: "Keyword too long (max 200 chars)." },
        { status: 400 }
      );
    }

    // Stage 1: Parallel discovery from all sources
    const [youtubeRes, tiktokRes, twitterRes, webRes] = await Promise.allSettled([
      searchYouTube(keyword, 5),
      searchTikTok(keyword),
      searchTwitter(keyword),
      searchWeb(keyword),
    ]);

    const youtube = youtubeRes.status === "fulfilled" ? youtubeRes.value : [];
    const tiktok  = tiktokRes.status  === "fulfilled" ? tiktokRes.value  : [];
    const twitter = twitterRes.status === "fulfilled" ? twitterRes.value : [];
    const web     = webRes.status     === "fulfilled" ? webRes.value     : [];

    // Count by web source
    const webByCse    = web.filter((v: any) => v.searchSource === "google_cse");
    const webByBrave  = web.filter((v: any) => v.searchSource === "brave");
    const webBySerp   = web.filter((v: any) => v.searchSource === "serpapi");

    // Merge + deduplicate by URL
    const seenUrls = new Set<string>();
    const candidates = [...web, ...youtube, ...tiktok, ...twitter].filter((v) => {
      if (seenUrls.has(v.url)) return false;
      seenUrls.add(v.url);
      return true;
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No candidates found. Try a different keyword." },
        { status: 404 }
      );
    }

    // Stage 2: AI Semantic Filtering — top 50, non-YouTube first
    const ranked = await rankVideosWithGemini(candidates, keyword, 50);

    // Sort: web search sources (SerpAPI/CSE/Brave) first, YouTube API last.
    // Use searchSource not platform — platform can be misdetected (e.g. Facebook → "youtube").
    const isYouTubeAPI = (v: any) => !v.searchSource; // YouTube API results have no searchSource
    ranked.sort((a: any, b: any) => {
      const aYT = isYouTubeAPI(a) ? 1 : 0;
      const bYT = isYouTubeAPI(b) ? 1 : 0;
      if (aYT !== bYT) return aYT - bYT;
      return b.score - a.score;
    });

    const top3 = ranked;

    const response: ScanResponse = {
      keyword,
      results: top3,
      totalCandidates: candidates.length,
      sources: {
        youtube:        youtube.length,
        tiktok_mock:    tiktok.length,
        twitter_mock:   twitter.length,
        web_google_cse: webByCse.length,
        web_brave:      webByBrave.length,
        web_serpapi:    webBySerp.length,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[/api/scan] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
