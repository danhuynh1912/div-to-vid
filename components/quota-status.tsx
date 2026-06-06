"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface QuotaEntry {
  used: number;
  limit: number;
  available: number;
  resetDate: string;
}

interface QuotaData {
  quota: Record<string, QuotaEntry>;
  configured: Record<string, boolean>;
  priority_order: string[];
}

const PROVIDER_LABELS: Record<string, string> = {
  google_custom_search: "Google CSE",
  brave_search: "Brave",
  serpapi: "SerpAPI",
};

export function QuotaStatus() {
  const [data, setData] = useState<QuotaData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/quota")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [open]);

  const activeCount = data
    ? Object.entries(data.configured).filter(([, v]) => v).length
    : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors"
      >
        <Activity className="w-3 h-3" />
        <span>Sources {activeCount > 0 ? `(${activeCount} web)` : ""}</span>
      </button>

      {open && data && (
        <div className="absolute right-0 top-8 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/50 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
            Web Search Quota
          </p>

          {data.priority_order.map((key, i) => {
            const entry = data.quota[key];
            const isConfigured = data.configured[key];
            const pct = entry ? Math.round((entry.used / entry.limit) * 100) : 0;
            const color = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500";

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-600">#{i + 1}</span>
                    <span className={`text-xs font-medium ${isConfigured ? "text-slate-300" : "text-slate-600"}`}>
                      {PROVIDER_LABELS[key]}
                    </span>
                    {!isConfigured && (
                      <span className="text-[9px] text-slate-700 bg-slate-800 px-1.5 py-0.5 rounded">
                        not set
                      </span>
                    )}
                  </div>
                  {isConfigured && entry && (
                    <span className="text-[10px] text-slate-500">
                      {entry.used}/{entry.limit}
                    </span>
                  )}
                </div>

                {isConfigured && entry && (
                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 border-t border-slate-800">
            <p className="text-[9px] text-slate-700 leading-relaxed">
              System tự động dùng provider còn quota. Video URLs được ưu tiên trước links thường.
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
