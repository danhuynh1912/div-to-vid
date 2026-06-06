import { VideoCandidate } from "./youtube";

// Mock data for TikTok & Twitter — intentionally covers DIVERSE, unrelated topics
// so Gemini AI (not hardcoded bias) decides relevance vs real YouTube results.

const TIKTOK_MOCK_POOL: Omit<VideoCandidate, "id">[] = [
  {
    title: "Làm bánh mì bơ tỏi tại nhà siêu ngon 🧄🍞",
    description:
      "Công thức bánh mì bơ tỏi đơn giản chỉ 20 phút, giòn tan thơm phức. #cooking #banh_mi #recipe",
    thumbnail: "https://picsum.photos/seed/tt1/320/180",
    url: "https://www.tiktok.com/@bepnha.vn/video/7891234567890",
    platform: "tiktok",
    channel: "@bepnha.vn",
    publishedAt: "2024-04-10",
  },
  {
    title: "Review iPhone 16 Pro sau 1 tháng dùng thực tế",
    description:
      "Trải nghiệm thực tế iPhone 16 Pro sau 30 ngày: pin, camera, hiệu năng có đáng tiền không? #iphone #review #tech",
    thumbnail: "https://picsum.photos/seed/tt2/320/180",
    url: "https://www.tiktok.com/@techviet.daily/video/7891234567891",
    platform: "tiktok",
    channel: "@techviet.daily",
    publishedAt: "2024-03-28",
  },
  {
    title: "Du lịch Đà Lạt tự túc 3 ngày 2 đêm với 2 triệu đồng",
    description:
      "Hành trình khám phá Đà Lạt tiết kiệm: ăn gì, ở đâu, đi đâu đẹp nhất mùa hoa. #travel #dalat #dulich",
    thumbnail: "https://picsum.photos/seed/tt3/320/180",
    url: "https://www.tiktok.com/@dulich.viet/video/7891234567892",
    platform: "tiktok",
    channel: "@dulich.viet",
    publishedAt: "2024-02-14",
  },
  {
    title: "Học tiếng Anh qua phim: 10 câu hay từ Suits",
    description:
      "Học cách nói tiếng Anh tự nhiên qua những câu thoại đắt giá từ series Suits. #english #hoctienganh",
    thumbnail: "https://picsum.photos/seed/tt4/320/180",
    url: "https://www.tiktok.com/@eng.daily.vn/video/7891234567893",
    platform: "tiktok",
    channel: "@eng.daily.vn",
    publishedAt: "2024-05-01",
  },
  {
    title: "Workout 15 phút mỗi sáng giảm mỡ bụng hiệu quả",
    description:
      "Bài tập HIIT buổi sáng không cần dụng cụ, đốt cháy mỡ bụng nhanh chóng ngay tại nhà. #fitness #workout #giam_can",
    thumbnail: "https://picsum.photos/seed/tt5/320/180",
    url: "https://www.tiktok.com/@fit.life.vn/video/7891234567894",
    platform: "tiktok",
    channel: "@fit.life.vn",
    publishedAt: "2024-04-20",
  },
];

const TWITTER_MOCK_POOL: Omit<VideoCandidate, "id">[] = [
  {
    title: "SpaceX Starship nails its 4th test flight — full booster catch attempt",
    description:
      "SpaceX successfully caught the Starship booster with mechazilla arms on the 4th integrated flight test. Historic moment for reusable rockets. #SpaceX #Starship",
    thumbnail: "https://picsum.photos/seed/tw1/320/180",
    url: "https://x.com/i/status/1773456789012345678",
    platform: "twitter",
    channel: "@SpaceNewsDaily",
    publishedAt: "2024-04-15",
  },
  {
    title: "Premier League: Man City vs Arsenal — 90+3 winner compilation",
    description:
      "All the dramatic last-minute goals from today's PL fixture. Haaland with the winner yet again. #PremierLeague #ManCity #Arsenal",
    thumbnail: "https://picsum.photos/seed/tw2/320/180",
    url: "https://x.com/i/status/1773456789012345679",
    platform: "twitter",
    channel: "@PL_Highlights",
    publishedAt: "2024-03-18",
  },
  {
    title: "Gordon Ramsay reacts to the worst scrambled eggs attempt on MasterChef",
    description:
      "Chef Ramsay's legendary reaction to rubbery scrambled eggs — this clip never gets old. #GordonRamsay #MasterChef #cooking",
    thumbnail: "https://picsum.photos/seed/tw3/320/180",
    url: "https://x.com/i/status/1773456789012345680",
    platform: "twitter",
    channel: "@FoodClipsTV",
    publishedAt: "2024-05-05",
  },
  {
    title: "Taylor Swift Eras Tour — full 3-hour concert highlights reel",
    description:
      "Best moments from Taylor Swift's record-breaking Eras Tour. Crowd of 80,000 singing every word. #TaylorSwift #ErasTour #music",
    thumbnail: "https://picsum.photos/seed/tw4/320/180",
    url: "https://x.com/i/status/1773456789012345681",
    platform: "twitter",
    channel: "@MusicMoments",
    publishedAt: "2024-02-20",
  },
  {
    title: "Extreme base jump from 4,000m peak goes wrong — terrifying near miss",
    description:
      "Wingsuit base jumper barely avoids cliff face in Swiss Alps. The GoPro footage is absolutely insane. #BaseJump #Extreme #GoPro",
    thumbnail: "https://picsum.photos/seed/tw5/320/180",
    url: "https://x.com/i/status/1773456789012345682",
    platform: "twitter",
    channel: "@ExtremeClips",
    publishedAt: "2024-01-30",
  },
];

export async function searchTikTok(keyword: string): Promise<VideoCandidate[]> {
  if (process.env.USE_MOCK_FALLBACK !== "true") {
    console.warn("[TikTok] Mock disabled — returning empty (no real TikTok API)");
    return [];
  }
  await new Promise((r) => setTimeout(r, Math.random() * 300 + 100));
  return TIKTOK_MOCK_POOL.map((v, i) => ({ ...v, id: `tt_${i}_${Date.now()}` }));
}

export async function searchTwitter(keyword: string): Promise<VideoCandidate[]> {
  if (process.env.USE_MOCK_FALLBACK !== "true") {
    console.warn("[Twitter] Mock disabled — returning empty (no real Twitter API)");
    return [];
  }
  await new Promise((r) => setTimeout(r, Math.random() * 300 + 100));
  return TWITTER_MOCK_POOL.map((v, i) => ({ ...v, id: `tw_${i}_${Date.now()}` }));
}
