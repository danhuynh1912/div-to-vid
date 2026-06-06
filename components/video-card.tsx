"use client";

import { useState } from "react";
import { Download, ExternalLink, Play, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { RankedVideo } from "@/lib/gemini";
import { toast } from "sonner";

interface VideoCardProps {
  video: RankedVideo;
  rank: number;
}

const PLATFORM_CONFIG = {
  youtube: {
    label: "YouTube",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: "▶",
  },
  tiktok: {
    label: "TikTok",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    icon: "♪",
  },
  twitter: {
    label: "X (Twitter)",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: "𝕏",
  },
};

function ScoreArc({ score }: { score: number }) {
  const size = 64;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  const color =
    score >= 80 ? "#22d3ee" : score >= 60 ? "#a78bfa" : "#f472b6";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function VideoCard({ video, rank }: VideoCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showCommand, setShowCommand] = useState<string | null>(null);

  const platform = PLATFORM_CONFIG[video.platform] ?? PLATFORM_CONFIG.youtube;

  async function handleDownload() {
    if (downloading || downloaded) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: video.url,
          title: video.title,
          platform: video.platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Download failed.");
        return;
      }

      setDownloaded(true);
      setShowCommand(data.ytdlpCommand);
      toast.success("yt-dlp command ready! Check below the card.", {
        description: "Copy the command to download locally.",
      });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const rankColor =
    rank === 1 ? "from-yellow-400 to-amber-500" :
    rank === 2 ? "from-slate-300 to-slate-400" :
    rank === 3 ? "from-amber-600 to-orange-700" :
    "from-slate-700 to-slate-800";

  const rankLabel =
    rank === 1 ? "TOP MATCH" :
    rank <= 3   ? `#${rank}` :
    `#${rank}`;

  return (
    <div className="group relative">
      {/* Rank badge */}
      <div
        className={`absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} flex items-center justify-center text-[10px] font-black text-slate-900 shadow-lg`}
      >
        {rank}
      </div>

      <Card className="
        bg-slate-900/70 border-slate-700/50
        hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5
        transition-all duration-300
        overflow-hidden
        backdrop-blur-sm
      ">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-slate-800 overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://picsum.photos/seed/${video.id}/640/360`;
            }}
          />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
          {/* Rank ribbon */}
          {rank <= 3 && (
            <div className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${rankColor} text-slate-900`}>
              {rankLabel}
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                {video.title}
              </p>
              {video.channel && (
                <p className="text-xs text-slate-500 mt-1">{video.channel}</p>
              )}
            </div>
            <ScoreArc score={video.score} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${platform.color}`}
            >
              <span className="mr-1">{platform.icon}</span>
              {platform.label}
            </Badge>
            {video.publishedAt && (
              <span className="text-[10px] text-slate-600">
                {video.publishedAt}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-2">
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
          {video.reason && (
            <p className="text-xs text-cyan-600/80 mt-2 italic line-clamp-1">
              AI: {video.reason}
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-2 flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className={`
              flex-1 h-9 text-xs font-semibold rounded-lg
              ${downloaded
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                : "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white"
              }
              transition-all duration-200
            `}
          >
            {downloading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Preparing…</>
            ) : downloaded ? (
              <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Command Ready</>
            ) : (
              <><Download className="w-3.5 h-3.5 mr-1.5" /> Download Video</>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
            onClick={() => window.open(video.url, "_blank")}
            title="Open on platform"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>

        {/* yt-dlp command reveal */}
        {showCommand && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-slate-950 border border-slate-700">
            <p className="text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wider">
              yt-dlp Command
            </p>
            <code className="text-[10px] text-emerald-400 break-all leading-relaxed">
              {showCommand}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(showCommand);
                toast.success("Copied to clipboard!");
              }}
              className="mt-2 text-[10px] text-cyan-500 hover:text-cyan-400 underline"
            >
              Copy command
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
