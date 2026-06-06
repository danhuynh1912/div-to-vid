import fs from "fs";
import path from "path";

// Persists quota usage to a local JSON file so counters survive server restarts.
// In production replace with Redis or a DB.

const QUOTA_FILE = path.join(process.cwd(), ".quota-usage.json");

interface QuotaState {
  google_custom_search: { used: number; resetDate: string };
  brave_search: { used: number; resetDate: string };
  serper: { used: number; resetDate: string };
  serpapi: { used: number; resetDate: string };
}

const DAILY_LIMITS = {
  google_custom_search: 100,   // free tier: 100/day
  brave_search: 2000,          // free tier: 2000/month
  serper: 2500,                // free tier: 2500 total (one-time)
  serpapi: 100,                // free trial: 100 total (one-time)
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadState(): QuotaState {
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      return JSON.parse(fs.readFileSync(QUOTA_FILE, "utf-8"));
    }
  } catch {}

  return {
    google_custom_search: { used: 0, resetDate: todayUTC() },
    brave_search: { used: 0, resetDate: thisMonthUTC() },
    serper: { used: 0, resetDate: thisMonthUTC() },
    serpapi: { used: 0, resetDate: thisMonthUTC() },
  };
}

function saveState(state: QuotaState): void {
  try {
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

export type SearchProvider = keyof QuotaState;

export function getQuotaStatus(): Record<SearchProvider, { used: number; limit: number; available: number; resetDate: string }> {
  const state = loadState();
  const result = {} as ReturnType<typeof getQuotaStatus>;

  for (const key of Object.keys(state) as SearchProvider[]) {
    const limit = DAILY_LIMITS[key];
    result[key] = {
      used: state[key].used,
      limit,
      available: Math.max(0, limit - state[key].used),
      resetDate: state[key].resetDate,
    };
  }

  return result;
}

export function isQuotaAvailable(provider: SearchProvider): boolean {
  const state = loadState();
  const entry = state[provider];
  const today = provider === "google_custom_search" ? todayUTC() : thisMonthUTC();

  // Auto-reset if period rolled over
  if (entry.resetDate < today) {
    entry.used = 0;
    entry.resetDate = today;
    saveState(state);
  }

  return entry.used < DAILY_LIMITS[provider];
}

export function consumeQuota(provider: SearchProvider, amount = 1): void {
  const state = loadState();
  state[provider].used += amount;
  saveState(state);
}
