"use client";

import { useState } from "react";
import { Video, Boxes, Cpu, Database, Zap } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { VideoCard } from "@/components/video-card";
import { ScanStepper } from "@/components/scan-stepper";
import { QuotaStatus } from "@/components/quota-status";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ScanResponse } from "./api/scan/route";

type AppState = "idle" | "loading" | "done" | "error";

export default function DivToVidPage() {
  const [state, setState] = useState<AppState>("idle");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSearch(keyword: string) {
    setState("loading");
    setScanResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Unknown error");
      }

      setScanResult(data as ScanResponse);
      setState("done");
      toast.success(`Found ${data.results.length} matches for "${keyword}" — non-YouTube first`);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong.");
      setState("error");
      toast.error("Scan failed", { description: err.message });
    }
  }

  return (
    <div className="min-h-dvh bg-[#080c14] bg-grid relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-1/4 w-[400px] h-[300px] rounded-full bg-blue-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* ── Header ── */}
        <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Video className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080c14] animate-pulse" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tight gradient-text" style={{ fontFamily: "var(--font-space)" }}>
                  DivToVid
                </span>
                <span className="text-[9px] text-slate-600 uppercase tracking-[0.15em] font-medium">
                  Divs to Vids Engine
                </span>
              </div>
            </div>

            {/* Nav badges */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 gap-1">
                <Cpu className="w-2.5 h-2.5" />
                Gemini Flash
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 gap-1">
                <Database className="w-2.5 h-2.5" />
                yt-dlp
              </Badge>
              <Badge variant="outline" className="text-[10px] border-emerald-700/50 text-emerald-500 gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </Badge>
              <QuotaStatus />
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="py-16 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-xs text-cyan-400 font-medium">
              <Boxes className="w-3.5 h-3.5" />
              Multimodal Video Crawler & AI Filtering Machine
            </div>

            <h1
              className="text-5xl sm:text-6xl font-black tracking-tight leading-none"
              style={{ fontFamily: "var(--font-space)" }}
            >
              <span className="gradient-text">Div</span>
              <span className="text-slate-100">To</span>
              <span className="gradient-text">Vid</span>
            </h1>

            <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Enter any semantic keyword. Our AI crawls YouTube + toàn bộ internet (Google CSE · Brave · SerpAPI),
              then uses <span className="text-cyan-400 font-medium">Gemini Flash</span> to
              surface the{" "}
              <span className="text-white font-semibold">Top 50 most accurate videos</span> — instantly.
            </p>

            {/* Pipeline tags */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-600">
              {["Discovery", "→", "AI Filtering", "→", "Top 3 Results", "→", "yt-dlp Download"].map(
                (t, i) => (
                  <span key={i} className={t === "→" ? "text-slate-700" : "text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50"}>
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* ── Search ── */}
        <section className="px-6 pb-10">
          <SearchBar onSearch={handleSearch} isLoading={state === "loading"} />
        </section>

        {/* ── Content Area ── */}
        <section className="flex-1 px-6 pb-16 max-w-6xl mx-auto w-full">
          {/* Loading stepper */}
          {state === "loading" && (
            <div className="max-w-xl mx-auto">
              <ScanStepper />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-slate-800">
                    <Skeleton className="w-full aspect-video bg-slate-800/60" />
                    <div className="p-4 space-y-2 bg-slate-900/50">
                      <Skeleton className="h-4 w-3/4 bg-slate-800/60" />
                      <Skeleton className="h-3 w-1/2 bg-slate-800/60" />
                      <Skeleton className="h-8 w-full mt-4 bg-slate-800/60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="max-w-md mx-auto text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <Zap className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-red-400 font-semibold">Scan Failed</p>
              <p className="text-sm text-slate-500">{errorMsg}</p>
              <button
                onClick={() => setState("idle")}
                className="text-xs text-cyan-500 hover:text-cyan-400 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {state === "done" && scanResult && (
            <div className="space-y-8">
              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Query</p>
                  <p className="text-sm text-slate-200 font-semibold mt-0.5">"{scanResult.keyword}"</p>
                </div>
                <div className="flex-1 hidden sm:block h-px bg-slate-800" />
                <div className="flex gap-4 text-center flex-wrap">
                  {[
                    { label: "Candidates", val: scanResult.totalCandidates },
                    { label: "YouTube", val: scanResult.sources.youtube, color: "text-red-400" },
                    { label: "Google CSE", val: scanResult.sources.web_google_cse, color: "text-yellow-400" },
                    { label: "Brave", val: scanResult.sources.web_brave, color: "text-orange-400" },
                    { label: "SerpAPI", val: scanResult.sources.web_serpapi, color: "text-purple-400" },
                    { label: "Top Picks", val: scanResult.results.length, color: "text-cyan-400" },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <p className={`text-base font-black ${color ?? "text-slate-100"}`}>{val}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {scanResult.results.map((video, i) => (
                  <VideoCard key={video.id} video={video} rank={i + 1} />
                ))}
              </div>

              <p className="text-center text-xs text-slate-700">
                Powered by <span className="text-cyan-600">DivToVid</span> · Gemini Flash AI · yt-dlp extraction
              </p>
            </div>
          )}

          {/* Idle state */}
          {state === "idle" && (
            <div className="text-center py-12 space-y-3">
              <div className="flex justify-center gap-3 opacity-30">
                {["▶ YouTube", "♪ TikTok", "𝕏 Twitter"].map((p) => (
                  <span key={p} className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                    {p}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-700">
                Enter a keyword above to start scanning
              </p>
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-800/60 py-5 px-6 text-center">
          <p className="text-xs text-slate-700">
            © 2024{" "}
            <span className="text-slate-500 font-semibold" style={{ fontFamily: "var(--font-space)" }}>
              DivToVid
            </span>{" "}
            · MVP Demo · Built with Next.js · Gemini Flash · yt-dlp
          </p>
        </footer>
      </div>
    </div>
  );
}
