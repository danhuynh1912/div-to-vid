import axios from "axios";
import { VideoCandidate } from "./youtube";
import { isQuotaAvailable, consumeQuota } from "./quota-tracker";

// Domains considered "video" platforms — results from these get priority boost
const VIDEO_DOMAINS = [
  "youtube.com", "youtu.be",
  "tiktok.com", "vm.tiktok.com",
  "x.com", "twitter.com",
  "vimeo.com",
  "dailymotion.com",
  "facebook.com/watch",
  "instagram.com/reel",
  "bilibili.com",
  "twitch.tv",
  "rumble.com",
];

function extractYouTubeThumbnail(url: string): string | undefined {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") videoId = u.pathname.slice(1);
    if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  } catch {}
  return undefined;
}

export function isVideoUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return VIDEO_DOMAINS.some((d) => url.includes(d));
  } catch {
    return false;
  }
}

function detectPlatform(url: string): VideoCandidate["platform"] {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  // Facebook, Vimeo, news sites, etc. → treat as "twitter" bucket (non-YouTube)
  return "twitter";
}

// ─── Google Custom Search ─────────────────────────────────────────────────────
// Setup: console.cloud.google.com → enable "Custom Search JSON API"
// Create a Search Engine at cse.google.com → get CX id
// Set GOOGLE_CSE_CX and GOOGLE_CSE_API_KEY (can reuse YOUTUBE_API_KEY) in .env.local

export async function searchGoogleCSE(keyword: string, maxResults = 10): Promise<VideoCandidate[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY || process.env.YOUTUBE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    console.warn("[GoogleCSE] Missing GOOGLE_CSE_CX or API key — skipping");
    return [];
  }

  if (!isQuotaAvailable("google_custom_search")) {
    console.warn("[GoogleCSE] Daily quota exhausted — skipping");
    return [];
  }

  try {
    // Two passes: one for video results, one for general web
    const [videoRes, webRes] = await Promise.allSettled([
      axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: apiKey, cx, q: `${keyword} video`, searchType: "video", num: 5 },
        timeout: 8000,
      }),
      axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: apiKey, cx, q: `${keyword} site:tiktok.com OR site:x.com OR site:youtube.com`, num: 5 },
        timeout: 8000,
      }),
    ]);

    consumeQuota("google_custom_search", 2); // 2 API calls

    const allItems: any[] = [
      ...(videoRes.status === "fulfilled" ? videoRes.value.data.items ?? [] : []),
      ...(webRes.status === "fulfilled" ? webRes.value.data.items ?? [] : []),
    ];

    // Deduplicate by link
    const seen = new Set<string>();
    return allItems
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      })
      .map((item, i) => ({
        id: `gcse_${i}_${Date.now()}`,
        title: item.title ?? "Untitled",
        description: item.snippet ?? "",
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.cse_image?.[0]?.src || `https://picsum.photos/seed/gcse${i}/320/180`,
        url: item.link,
        platform: detectPlatform(item.link),
        channel: item.displayLink,
        publishedAt: item.pagemap?.metatags?.[0]?.["article:published_time"]?.slice(0, 10),
        isVideoUrl: isVideoUrl(item.link),
      }));
  } catch (err: any) {
    console.error("[GoogleCSE] Error:", err.message);
    return [];
  }
}

// ─── Brave Search API ─────────────────────────────────────────────────────────
// Free tier: 2000 queries/month
// Get key: brave.com/search/api/ → "Data for Search" plan (free)
// Set BRAVE_API_KEY in .env.local

export async function searchBrave(keyword: string, maxResults = 10): Promise<VideoCandidate[]> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.warn("[Brave] Missing BRAVE_API_KEY — skipping");
    return [];
  }

  if (!isQuotaAvailable("brave_search")) {
    console.warn("[Brave] Monthly quota exhausted — skipping");
    return [];
  }

  try {
    const [videoRes, webRes] = await Promise.allSettled([
      axios.get("https://api.search.brave.com/res/v1/videos/search", {
        headers: { "Accept": "application/json", "X-Subscription-Token": apiKey },
        params: { q: keyword, count: maxResults },
        timeout: 8000,
      }),
      axios.get("https://api.search.brave.com/res/v1/web/search", {
        headers: { "Accept": "application/json", "X-Subscription-Token": apiKey },
        params: {
          q: `${keyword} site:tiktok.com OR site:x.com OR site:youtube.com`,
          count: 5,
        },
        timeout: 8000,
      }),
    ]);

    consumeQuota("brave_search", 2);

    const results: VideoCandidate[] = [];

    // Video results
    if (videoRes.status === "fulfilled") {
      const items = videoRes.value.data.results ?? [];
      items.forEach((item: any, i: number) => {
        results.push({
          id: `brave_v${i}_${Date.now()}`,
          title: item.title ?? "Untitled",
          description: item.description ?? "",
          thumbnail: item.thumbnail?.src || `https://picsum.photos/seed/bv${i}/320/180`,
          url: item.url,
          platform: detectPlatform(item.url),
          channel: item.author ?? item.page_fetched,
          publishedAt: item.age ? new Date(item.age).toISOString().slice(0, 10) : undefined,
        });
      });
    }

    // Web results (links to video platforms)
    if (webRes.status === "fulfilled") {
      const items = webRes.value.data.web?.results ?? [];
      items.forEach((item: any, i: number) => {
        if (isVideoUrl(item.url)) {
          results.push({
            id: `brave_w${i}_${Date.now()}`,
            title: item.title ?? "Untitled",
            description: item.description ?? "",
            thumbnail: item.thumbnail?.src || `https://picsum.photos/seed/bw${i}/320/180`,
            url: item.url,
            platform: detectPlatform(item.url),
            channel: item.profile?.name ?? item.meta_url?.hostname,
            publishedAt: item.page_age?.slice(0, 10),
          });
        }
      });
    }

    return results;
  } catch (err: any) {
    console.error("[Brave] Error:", err.message);
    return [];
  }
}

// ─── Serper.dev ───────────────────────────────────────────────────────────────
// Free tier: 2,500 searches (one-time)
// Get key: serper.dev → Dashboard → API Key
// Set SERPER_API_KEY in .env.local

export async function searchSerper(keyword: string, maxResults = 100): Promise<VideoCandidate[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn("[Serper] Missing SERPER_API_KEY — skipping");
    return [];
  }

  if (!isQuotaAvailable("serper")) {
    console.warn("[Serper] Quota exhausted — skipping");
    return [];
  }

  try {
    const [videoRes, webRes] = await Promise.allSettled([
      axios.post("https://google.serper.dev/videos", {
        q: keyword,
        num: maxResults,
        gl: "vn",
        hl: "vi",
      }, {
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        timeout: 8000,
      }),
      axios.post("https://google.serper.dev/search", {
        q: `${keyword} site:tiktok.com OR site:x.com OR site:facebook.com`,
        num: maxResults,
        gl: "vn",
        hl: "vi",
      }, {
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        timeout: 8000,
      }),
    ]);

    consumeQuota("serper", 2);

    const results: VideoCandidate[] = [];
    const seen = new Set<string>();

    // Video results
    if (videoRes.status === "fulfilled") {
      const items = videoRes.value.data.videos ?? [];
      items.forEach((item: any, i: number) => {
        if (seen.has(item.link)) return;
        seen.add(item.link);
        results.push({
          id: `serper_v${i}_${Date.now()}`,
          title: item.title ?? "Untitled",
          description: item.snippet ?? "",
          thumbnail: item.imageUrl ?? extractYouTubeThumbnail(item.link),
          url: item.link,
          platform: detectPlatform(item.link),
          channel: item.channel ?? item.source,
          publishedAt: item.date ? new Date(item.date).toISOString().slice(0, 10) : undefined,
        });
      });
    }

    // Web results (video platform links)
    if (webRes.status === "fulfilled") {
      const items = webRes.value.data.organic ?? [];
      items.forEach((item: any, i: number) => {
        if (seen.has(item.link) || !isVideoUrl(item.link)) return;
        seen.add(item.link);
        results.push({
          id: `serper_w${i}_${Date.now()}`,
          title: item.title ?? "Untitled",
          description: item.snippet ?? "",
          thumbnail: item.imageUrl ?? extractYouTubeThumbnail(item.link),
          url: item.link,
          platform: detectPlatform(item.link),
          channel: item.displayedLink,
          publishedAt: item.date ? new Date(item.date).toISOString().slice(0, 10) : undefined,
        });
      });
    }

    console.log(`[Serper] ${results.length} results`);
    return results;
  } catch (err: any) {
    console.error("[Serper] Error:", err.message);
    return [];
  }
}

// ─── SerpAPI ──────────────────────────────────────────────────────────────────
// Paid service with free trial (100 searches)
// Get key: serpapi.com → Dashboard
// Set SERPAPI_KEY in .env.local

export async function searchSerpAPI(keyword: string, maxResults = 10): Promise<VideoCandidate[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.warn("[SerpAPI] Missing SERPAPI_KEY — skipping");
    return [];
  }

  if (!isQuotaAvailable("serpapi")) {
    console.warn("[SerpAPI] Quota exhausted — skipping");
    return [];
  }

  try {
    const [videoRes, webRes] = await Promise.allSettled([
      axios.get("https://serpapi.com/search.json", {
        params: { engine: "google_videos", q: keyword, api_key: apiKey, num: maxResults },
        timeout: 10000,
      }),
      axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google",
          q: `${keyword} site:tiktok.com OR site:x.com`,
          api_key: apiKey,
          num: 5,
        },
        timeout: 10000,
      }),
    ]);

    consumeQuota("serpapi", 2);

    const results: VideoCandidate[] = [];

    if (videoRes.status === "fulfilled") {
      const items = videoRes.value.data.video_results ?? [];
      items.slice(0, maxResults).forEach((item: any, i: number) => {
        results.push({
          id: `serp_v${i}_${Date.now()}`,
          title: item.title ?? "Untitled",
          description: item.description ?? item.snippet ?? "",
          thumbnail: item.thumbnail ?? `https://picsum.photos/seed/sv${i}/320/180`,
          url: item.link,
          platform: detectPlatform(item.link),
          channel: item.channel?.name ?? item.source,
          publishedAt: item.date?.slice(0, 10),
        });
      });
    }

    if (webRes.status === "fulfilled") {
      const items = webRes.value.data.organic_results ?? [];
      items.forEach((item: any, i: number) => {
        if (isVideoUrl(item.link)) {
          results.push({
            id: `serp_w${i}_${Date.now()}`,
            title: item.title ?? "Untitled",
            description: item.snippet ?? "",
            thumbnail: item.thumbnail ?? `https://picsum.photos/seed/sw${i}/320/180`,
            url: item.link,
            platform: detectPlatform(item.link),
            channel: item.displayed_link,
          });
        }
      });
    }

    return results;
  } catch (err: any) {
    console.error("[SerpAPI] Error:", err.message);
    return [];
  }
}

// ─── Unified Web Search with smart fallback ───────────────────────────────────

export interface WebSearchResult extends VideoCandidate {
  isVideoUrl?: boolean;
  searchSource: "google_cse" | "serper" | "brave" | "serpapi";
}

export async function searchWeb(keyword: string): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  const providersUsed: string[] = [];

  const isReal = (v?: string) => !!v && !v.startsWith("your_");

  // Sequential fallback: CSE → Brave → SerpAPI
  // Next provider only called if previous returned 0 results — saves paid quota.
  const PROVIDERS: Array<{
    name: string;
    source: WebSearchResult["searchSource"];
    enabled: () => boolean;
    fetch: () => Promise<VideoCandidate[]>;
  }> = [
    {
      name: "GoogleCSE",
      source: "google_cse",
      enabled: () => isQuotaAvailable("google_custom_search") && isReal(process.env.GOOGLE_CSE_CX),
      fetch: () => searchGoogleCSE(keyword),
    },
    {
      name: "Serper",
      source: "serper" as any,
      enabled: () => isQuotaAvailable("serper") && isReal(process.env.SERPER_API_KEY),
      fetch: () => searchSerper(keyword),
    },
    {
      name: "Brave",
      source: "brave",
      enabled: () => isQuotaAvailable("brave_search") && isReal(process.env.BRAVE_API_KEY),
      fetch: () => searchBrave(keyword),
    },
    {
      name: "SerpAPI",
      source: "serpapi",
      enabled: () => isQuotaAvailable("serpapi") && isReal(process.env.SERPAPI_KEY),
      fetch: () => searchSerpAPI(keyword),
    },
  ];

  for (const provider of PROVIDERS) {
    if (!provider.enabled()) {
      console.log(`[WebSearch] ${provider.name} — skipped (not configured or quota exhausted)`);
      continue;
    }

    try {
      const items = await provider.fetch();
      if (items.length > 0) {
        items.forEach((v) => results.push({ ...v, searchSource: provider.source }));
        providersUsed.push(`${provider.name}(${items.length})`);
        console.log(`[WebSearch] ${provider.name} returned ${items.length} results — stopping chain`);
        break; // Got results — no need to call next provider
      }
      console.warn(`[WebSearch] ${provider.name} returned 0 results — trying next provider`);
    } catch (err: any) {
      console.error(`[WebSearch] ${provider.name} error: ${err.message} — trying next provider`);
    }
  }

  if (providersUsed.length > 0) {
    console.log(`[WebSearch] Used: ${providersUsed.join(", ")} — ${results.length} total`);
  } else {
    console.warn("[WebSearch] All providers exhausted or unconfigured — web results empty");
  }

  // Sort: video URLs first, then by source priority
  const sourcePriority = { google_cse: 0, serper: 1, brave: 2, serpapi: 3 };
  results.sort((a, b) => {
    const aIsVideo = isVideoUrl(a.url) ? 0 : 1;
    const bIsVideo = isVideoUrl(b.url) ? 0 : 1;
    if (aIsVideo !== bIsVideo) return aIsVideo - bIsVideo;
    return sourcePriority[a.searchSource] - sourcePriority[b.searchSource];
  });

  // Deduplicate by URL
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
