import axios from "axios";

export interface VideoCandidate {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  platform: "youtube" | "tiktok" | "twitter";
  channel?: string;
  publishedAt?: string;
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const YOUTUBE_MOCK_DATA: VideoCandidate[] = [
  {
    id: "yt_mock_1",
    title: "Unexpected Animal Incident Caught on Camera - Shocking Compilation",
    description:
      "A jaw-dropping collection of unexpected animal encounters that left everyone speechless. Watch as wild animals create chaos in the most unexpected moments.",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "youtube",
    channel: "WildLife Shocks",
    publishedAt: "2024-03-15",
  },
  {
    id: "yt_mock_2",
    title: "Animals Causing Accidents - Unbelievable Road Incidents 2024",
    description:
      "Real footage of animals unexpectedly appearing on roads causing near-miss accidents. Deer, boars, and more caught on dashcam.",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    platform: "youtube",
    channel: "DashCam World",
    publishedAt: "2024-02-28",
  },
  {
    id: "yt_mock_3",
    title: "Wild Animal Attack Compilation - Nature's Unexpected Moments",
    description:
      "Incredible and terrifying moments where wild animals acted unpredictably. Safety reminder: always be cautious around wildlife.",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    platform: "youtube",
    channel: "Nature Extreme",
    publishedAt: "2024-01-10",
  },
  {
    id: "yt_mock_4",
    title: "Tai Nạn Bất Ngờ - Động Vật Chặn Đường Gây Tai Nạn",
    description:
      "Những vụ tai nạn giao thông bất ngờ do động vật hoang dã xuất hiện trên đường. Cảnh báo an toàn khi lái xe.",
    thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    platform: "youtube",
    channel: "An Toàn Giao Thông VN",
    publishedAt: "2024-03-20",
  },
  {
    id: "yt_mock_5",
    title: "Shocking Animal Road Crossing Accidents - Must Watch Safety Video",
    description:
      "Drivers beware! This compilation shows how quickly animals can appear on roads, causing dangerous situations. Drive safely.",
    thumbnail: "https://img.youtube.com/vi/L_jWHffIx5E/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=L_jWHffIx5E",
    platform: "youtube",
    channel: "Safe Drive Today",
    publishedAt: "2024-04-01",
  },
];

export async function searchYouTube(
  keyword: string,
  maxResults = 5
): Promise<VideoCandidate[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  const useMock = process.env.USE_MOCK_FALLBACK === "true";

  if (!apiKey || apiKey === "your_youtube_api_key_here") {
    if (!useMock) { console.warn("[YouTube] No API key & mock disabled — returning empty"); return []; }
    console.warn("[YouTube] No API key — using mock data");
    return generateMockYouTubeResults(keyword);
  }

  try {
    const searchRes = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: "snippet",
        q: keyword,
        type: "video",
        maxResults,
        key: apiKey,
        relevanceLanguage: "vi",
        safeSearch: "moderate",
      },
      timeout: 10000,
    });

    const items = searchRes.data.items ?? [];

    return items.map((item: any) => ({
      id: `yt_${item.id.videoId}`,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      platform: "youtube" as const,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt?.slice(0, 10),
    }));
  } catch (err: any) {
    if (!useMock) { console.error("[YouTube] API error:", err.message, "— mock disabled, returning empty"); return []; }
    console.error("[YouTube] API error:", err.message, "— falling back to mock");
    return generateMockYouTubeResults(keyword);
  }
}

function generateMockYouTubeResults(keyword: string): VideoCandidate[] {
  return YOUTUBE_MOCK_DATA.map((v) => ({
    ...v,
    title: v.title,
    description: `[Mock] ${v.description} — Query: "${keyword}"`,
  }));
}
