import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/quota-tracker";

export async function GET() {
  const quota = getQuotaStatus();

  function isReal(val: string | undefined): boolean {
    return !!val && !val.startsWith("your_");
  }

  const configured = {
    google_custom_search: isReal(process.env.GOOGLE_CSE_CX) && !!(process.env.GOOGLE_CSE_API_KEY || process.env.YOUTUBE_API_KEY),
    serper: isReal(process.env.SERPER_API_KEY),
    brave_search: isReal(process.env.BRAVE_API_KEY),
    serpapi: isReal(process.env.SERPAPI_KEY),
  };

  return NextResponse.json({
    quota,
    configured,
    priority_order: ["google_custom_search", "serper", "brave_search", "serpapi"],
  });
}
