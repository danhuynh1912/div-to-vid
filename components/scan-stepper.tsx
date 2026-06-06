"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Globe, Brain, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Globe,
    label: "Searching internet platforms",
    sub: "YouTube · TikTok · X (Twitter)",
    duration: 2200,
  },
  {
    icon: Brain,
    label: "AI filtering content",
    sub: "Gemini Flash semantic analysis",
    duration: 2800,
  },
  {
    icon: Sparkles,
    label: "Ranking top matches",
    sub: "Scoring by relevance · Preparing results",
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

      const cumulative = STEPS.slice(0, step + 1).reduce((a, s) => a + s.duration, 0);
      if (elapsed >= cumulative && step < STEPS.length - 1) {
        step++;
        setActiveStep(step);
      }
    }, 80);

    return () => clearInterval(tick);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto py-8 space-y-0">
      {STEPS.map((step, i) => {
        const StepIcon = step.icon;
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        const isPending = !isDone && !isActive;

        return (
          <div key={i} className="flex gap-5">
            {/* Left: connector line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                  ${isDone ? "bg-[#1a3d2e]" : isActive ? "bg-[#223d56]/60" : "bg-white/5"}
                `}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-[#4db88a]" strokeWidth={2.5} />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-[#7eb8d4] animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-px flex-1 my-1 transition-all duration-700 ${
                    isDone ? "bg-[#4db88a]/30" : "bg-white/8"
                  }`}
                  style={{ minHeight: "28px" }}
                />
              )}
            </div>

            {/* Right: text */}
            <div className={`pb-7 transition-all duration-500 ${isPending ? "opacity-25" : "opacity-100"}`}>
              <p
                className={`text-sm font-medium tracking-wide transition-colors duration-500 ${
                  isDone ? "text-[#4db88a]" : isActive ? "text-white" : "text-white/50"
                }`}
              >
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 transition-colors duration-500 ${
                isDone ? "text-[#4db88a]/50" : isActive ? "text-white/35" : "text-white/20"
              }`}>
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}

      {/* Progress bar */}
      <div className="mt-2 h-px w-full bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4a7fa5] rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
