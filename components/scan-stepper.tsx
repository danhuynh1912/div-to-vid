"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Globe, Brain, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  {
    icon: Globe,
    label: "DivToVid Engine searching internet platforms…",
    sub: "Querying YouTube · TikTok · X (Twitter)",
    duration: 2200,
  },
  {
    icon: Brain,
    label: "Activating AI Brain to filter content…",
    sub: "Gemini Flash multimodal semantic analysis",
    duration: 2800,
  },
  {
    icon: Sparkles,
    label: "Extracting Top 3 Ultimate Matches…",
    sub: "Ranking by accuracy score · Preparing results",
    duration: 1200,
  },
];

export function ScanStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let step = 0;
    let elapsed = 0;
    const totalDuration = STEPS.reduce((a, s) => a + s.duration, 0);

    const tick = setInterval(() => {
      elapsed += 80;
      setProgress(Math.min((elapsed / totalDuration) * 100, 95));

      const cumulative = STEPS.slice(0, step + 1).reduce(
        (a, s) => a + s.duration,
        0
      );
      if (elapsed >= cumulative && step < STEPS.length - 1) {
        step++;
        setActiveStep(step);
      }
    }, 80);

    return () => clearInterval(tick);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-8">
      <Progress
        value={progress}
        className="h-1.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500"
      />

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isDone = i < activeStep;
          const isActive = i === activeStep;

          return (
            <div
              key={i}
              className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all duration-500
                ${isDone
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isActive
                  ? "border-cyan-500/40 bg-cyan-500/5 shadow-sm shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-900/30 opacity-40"
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${isDone ? "bg-emerald-500/20" : isActive ? "bg-cyan-500/20" : "bg-slate-800"}
                `}
              >
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <StepIcon className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isDone
                      ? "text-emerald-400"
                      : isActive
                      ? "text-cyan-300"
                      : "text-slate-600"
                  }`}
                >
                  [{i + 1}] {step.label}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
