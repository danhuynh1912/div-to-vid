import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { VideoCandidate } from "./youtube";

export interface RankedVideo extends VideoCandidate {
  score: number;
  reason: string;
}

interface GeminiRankResult {
  id: string;
  score: number;
  reason: string;
}

const RESPONSE_SCHEMA = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      score: { type: SchemaType.NUMBER },
      reason: { type: SchemaType.STRING },
    },
    required: ["id", "score", "reason"],
  },
};

export async function rankVideosWithGemini(
  candidates: VideoCandidate[],
  keyword: string,
  topN = 50
): Promise<RankedVideo[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("[Gemini] No API key — using mock ranking");
    return simpleRankVideos(candidates, keyword);
  }

  // Try models in order: 2.0-flash → 2.0-flash-lite (lighter quota) → 2.5-flash (newest)
  const MODEL_PRIORITY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
  ];

  for (const modelName of MODEL_PRIORITY) {
    try {
      return await callGemini(apiKey, modelName, candidates, keyword, topN);
    } catch (err: any) {
      const is429 = err?.message?.includes("429") || err?.message?.includes("quota");
      if (is429 && modelName !== MODEL_PRIORITY[MODEL_PRIORITY.length - 1]) {
        console.warn(`[Gemini] ${modelName} quota exceeded — trying next model`);
        continue;
      }
      // Non-quota error — fall through to simple score-based ranking
      console.error("[Gemini] API error:", err.message, "— using score-based ranking");
      break;
    }
  }

  // All Gemini models failed — rank by simple keyword score (no mock data injected)
  return simpleRankVideos(candidates, keyword, topN);
}

async function callGemini(
  apiKey: string,
  modelName: string,
  candidates: VideoCandidate[],
  keyword: string,
  topN: number
): Promise<RankedVideo[]> {
  console.log(`[Gemini] Trying model: ${modelName}`);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as any,
      temperature: 0.2,
    },
  });

  const metadataList = candidates
    .map(
      (v, i) =>
        `[${i + 1}] ID: ${v.id}\n  Platform: ${v.platform}\n  Title: ${v.title}\n  Description: ${v.description}`
    )
    .join("\n\n");

  const prompt = `You are a multimodal video relevance judge for the DivToVid platform.

User is searching for videos about: "${keyword}"

Below is a list of video metadata candidates collected from multiple platforms.
Analyze each video's title and description. Evaluate how accurately and directly each video depicts or relates to the topic: "${keyword}".

Score each video from 0 to 100 where:
- 90-100: Extremely relevant, directly about the topic
- 70-89: Highly relevant, closely related
- 50-69: Moderately relevant, somewhat related
- 0-49: Not relevant or only tangentially related

Return ALL candidates ranked by score. For each, include a short reason (1 sentence max) explaining your score.

VIDEO METADATA:
${metadataList}

Return a JSON array with ALL ${candidates.length} items ranked by score descending.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let rankings: GeminiRankResult[] = JSON.parse(text);
  rankings.sort((a, b) => b.score - a.score);
  rankings = rankings.slice(0, topN);

  console.log(`[Gemini] ${modelName} success — top scores: ${rankings.map((r) => r.score).join(", ")}`);

  return rankings.flatMap((rank) => {
    const candidate = candidates.find((c) => c.id === rank.id);
    if (!candidate) return [];
    return [{ ...candidate, score: rank.score, reason: rank.reason }];
  });
}

// Keyword-based scoring fallback — used when all Gemini models are unavailable.
// Works on real candidates only, no mock data injected.
function simpleRankVideos(
  candidates: VideoCandidate[],
  keyword: string,
  topN = 50
): RankedVideo[] {
  const lower = keyword.toLowerCase();

  const scored = candidates.map((v) => {
    const text = `${v.title} ${v.description}`.toLowerCase();
    let score = 0;

    // Basic keyword matching score
    const words = lower.split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (word.length > 2 && text.includes(word)) {
        score += 20;
      }
    }

    // Platform diversity bonus
    if (v.platform === "youtube") score += 5;

    // Recency bonus
    if (v.publishedAt && v.publishedAt >= "2024-03") score += 5;

    // Add some deterministic variance based on id hash
    const hash = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    score = score + (hash % 11) - 5;

    // Clamp to valid range
    score = Math.max(10, Math.min(97, score));

    return {
      ...v,
      score,
      reason: `Keyword match score for "${keyword}".`,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}
