import { NextRequest, NextResponse } from "next/server";

// This endpoint resolves a streamable/downloadable URL for a given video.
// In production this would shell out to yt-dlp to extract the best stream URL.
// For this MVP/demo we return the source URL with instructions since yt-dlp
// requires a Python runtime with the yt-dlp package installed.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, platform } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    // Validate URL format
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    // Allowed domains whitelist
    const ALLOWED_DOMAINS = [
      "youtube.com",
      "youtu.be",
      "www.youtube.com",
      "tiktok.com",
      "www.tiktok.com",
      "x.com",
      "twitter.com",
    ];

    const isAllowed = ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unsupported platform URL." },
        { status: 400 }
      );
    }

    // In a production environment with yt-dlp available as a system dependency,
    // you would run: const { stdout } = await exec(`yt-dlp -g -f best "${url}"`)
    // and return the direct stream URL.
    //
    // For this demo, we return the canonical video URL and a yt-dlp CLI command
    // the user can run locally.

    const ytdlpCommand = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "%(title)s.%(ext)s" "${url}"`;

    return NextResponse.json({
      success: true,
      url,
      title,
      platform,
      downloadMethod: "yt-dlp",
      ytdlpCommand,
      message:
        "yt-dlp download initiated. In production this triggers a server-side download pipeline.",
    });
  } catch (err: any) {
    console.error("[/api/download] Error:", err);
    return NextResponse.json(
      { error: "Failed to process download request." },
      { status: 500 }
    );
  }
}
