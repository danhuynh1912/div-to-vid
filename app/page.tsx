"use client";

import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { VideoCard } from "@/components/video-card";
import { ScanStepper } from "@/components/scan-stepper";
import { QuotaStatus } from "@/components/quota-status";
import { Skeleton } from "@/components/ui/skeleton";
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
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      setScanResult(data as ScanResponse);
      setState("done");
      toast.success(`${data.results.length} videos found for "${keyword}"`);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong.");
      setState("error");
      toast.error("Scan failed", { description: err.message });
    }
  }

  return (
    <div className="min-h-dvh bg-[#0b1220] text-white" style={{ fontFamily: "var(--font-outfit)" }}>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center">
          <span className="text-xl font-semibold tracking-tight text-white">DivToVid</span>
        </div>
      </header>

      {/* ── Hero ── */}
      {(state === "idle" || state === "loading" || state === "error") && (
        <section className="relative flex flex-col items-center justify-center min-h-dvh text-center px-6 pt-16">

          {/* Blue bottom glow */}
          <div className="hero-glow" />

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-[#0a1220]">
            AI Powered Video Search
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-light leading-[0.9] tracking-tight text-white mb-6" style={{ fontFamily: "var(--font-outfit)" }}>
            Search.<br />
            Discover.<br />
            Download.
          </h1>

          {/* Subtitle */}
          <p className="text-base font-light text-white/40 max-w-md mx-auto mb-10 leading-relaxed">
            Type any keyword and let AI scan YouTube and the web, then rank every result by relevance.
          </p>

          {/* Search bar */}
          {state === "idle" && (
            <div className="w-full max-w-xl">
              <SearchBar onSearch={handleSearch} isLoading={false} />
            </div>
          )}

          {/* Loading */}
          {state === "loading" && (
            <div className="w-full max-w-xl">
              <ScanStepper />
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 font-medium">Scan failed</p>
              <p className="text-sm text-white/30">{errorMsg}</p>
              <button
                onClick={() => setState("idle")}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-full border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Try again <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Results ── */}
      {state === "done" && scanResult && (
        <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">

          {/* Stats + new search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Query</p>
              <p className="text-lg font-light text-white">"{scanResult.keyword}"</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-semibold text-white">{scanResult.totalCandidates}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Scanned</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-blue-400">{scanResult.results.length}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Results</p>
              </div>
              <button
                onClick={() => setState("idle")}
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                New search <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {scanResult.results.map((video, i) => (
              <VideoCard key={video.id} video={video} rank={i + 1} />
            ))}
          </div>

          <p className="text-center text-xs text-white/10 mt-16">
            © {new Date().getFullYear()} DivToVid
          </p>
        </div>
      )}
    </div>
  );
}
