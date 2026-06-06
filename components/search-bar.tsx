"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Search, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const EXAMPLE_QUERIES = [
  "Tai nạn bất ngờ do động vật",
  "Wild animal road accident",
  "Elephant charges car",
  "Snake on highway",
  "Bear encounter dashcam",
];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSearch(trimmed);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleExample(q: string) {
    setValue(q);
    inputRef.current?.focus();
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Search Input Row */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter semantic search keyword…"
            disabled={isLoading}
            className="
              h-14 pl-12 pr-12 text-base rounded-xl
              bg-slate-900/80 border-slate-700
              text-slate-100 placeholder:text-slate-500
              focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500
              transition-all duration-200
            "
          />
          {value && !isLoading && (
            <button
              onClick={() => setValue("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="
            h-14 px-7 rounded-xl font-semibold text-sm tracking-wide
            bg-gradient-to-r from-cyan-500 to-blue-600
            hover:from-cyan-400 hover:to-blue-500
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white shadow-lg shadow-cyan-500/20
            transition-all duration-200
            flex items-center gap-2
          "
        >
          <Zap className="w-4 h-4" />
          {isLoading ? "Scanning…" : "Scan"}
        </Button>
      </div>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          Try:
        </span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleExample(q)}
            disabled={isLoading}
            className="
              text-xs px-3 py-1.5 rounded-full
              border border-slate-700 text-slate-400
              hover:border-cyan-500/50 hover:text-cyan-400
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
