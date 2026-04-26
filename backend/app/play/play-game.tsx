"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import type { QuestionDTO } from "@/lib/questions";
import { playCorrect, playWrong } from "@/lib/sounds";

type NextResponse =
  | { question: QuestionDTO; exhausted?: false }
  | { question: null; exhausted: true; total: number };

const SEEN_KEY = "wim_seen_slugs";
const BEST_STREAK_KEY = "wim_best_streak";
const MUTED_KEY = "wim_muted";
const IMAGE_MODE_KEY = "wim_image_mode";

function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveSeen(slugs: string[]) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(slugs));
  } catch {
    // quota / disabled storage — no-op
  }
}
function loadBestStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(BEST_STREAK_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}
function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}
function loadImageMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(IMAGE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function PlayGame({
  initial,
  category,
}: {
  initial: QuestionDTO | null;
  category: string | null;
}) {
  const [question, setQuestion] = useState<QuestionDTO | null>(initial);
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [muted, setMuted] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [error, setError] = useState<string | null>(initial ? null : "No questions available");
  const [exhausted, setExhausted] = useState(false);
  const [voteStats, setVoteStats] = useState<{ votesA: number; votesB: number } | null>(null);

  useEffect(() => {
    // One-shot hydration from localStorage. Pulled in an effect because the
    // value must come from a client-only source (not available during SSR)
    // and doesn't need cross-tab reactivity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBestStreak(loadBestStreak());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(loadMuted());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageMode(loadImageMode());
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable — non-fatal
      }
      return next;
    });
  };

  const toggleImageMode = () => {
    setImageMode((m) => {
      const next = !m;
      try {
        localStorage.setItem(IMAGE_MODE_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable — non-fatal
      }
      return next;
    });
  };

  useEffect(() => {
    if (!newBest) return;
    const t = setTimeout(() => setNewBest(false), 1800);
    return () => clearTimeout(t);
  }, [newBest]);

  const fetchNext = async (reset = false) => {
    setLoading(true);
    setPicked(null);
    setVoteStats(null);
    setError(null);
    try {
      const seen = reset ? [] : loadSeen();
      if (reset) saveSeen([]);
      const params = new URLSearchParams();
      if (seen.length) params.set("exclude", seen.join(","));
      if (category) params.set("category", category);
      const qs = params.toString();
      const url = qs ? `/api/questions/random?${qs}` : "/api/questions/random";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = (await res.json()) as NextResponse;
      if (!data.question) {
        setExhausted(true);
        setQuestion(null);
      } else {
        setExhausted(false);
        setQuestion(data.question);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (choice: "A" | "B") => {
    if (!question || picked !== null) return;
    setPicked(choice);
    const correct = choice === question.answer;
    setTotal((n) => n + 1);
    if (correct) setCorrect((n) => n + 1);
    if (!muted) {
      if (correct) playCorrect();
      else playWrong();
    }
    if (correct) {
      setStreak((s) => {
        const next = s + 1;
        if (next > bestStreak) {
          setBestStreak(next);
          setNewBest(true);
          try {
            localStorage.setItem(BEST_STREAK_KEY, String(next));
          } catch {
            // storage unavailable — not fatal
          }
        }
        return next;
      });
    } else {
      setStreak(0);
    }
    const seen = loadSeen();
    if (!seen.includes(question.slug)) saveSeen([...seen, question.slug]);
    // Fire vote — non-blocking, result populates social proof bars
    fetch(`/api/questions/${question.slug}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option: choice }),
    })
      .then((r) => r.json())
      .then((data) => setVoteStats(data as { votesA: number; votesB: number }))
      .catch(() => {});
  };

  const restart = () => {
    setStreak(0);
    setCorrect(0);
    setTotal(0);
    fetchNext(true);
  };

  const scoreSubtitle = (() => {
    if (total === 0) return "";
    const pct = correct / total;
    if (pct >= 0.9) return "Fact machine!";
    if (pct >= 0.7) return "Nice work!";
    if (pct >= 0.5) return "Not bad!";
    return "Ouch — try again?";
  })();

  return (
    <main className="flex-1 flex flex-col min-h-[100dvh]">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-black/5">
        <Link
          href="/"
          aria-label="Home"
          className="text-red-600 font-bold text-sm uppercase tracking-widest"
        >
          ← Home
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleImageMode}
            aria-label={imageMode ? "Switch to emoji mode" : "Switch to photo mode"}
            title={imageMode ? "Photo mode — tap for emoji" : "Emoji mode — tap for photos"}
            className="text-base px-2 py-1 rounded-full hover:bg-black/5 transition"
          >
            {imageMode ? "📸" : "🎨"}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="text-base px-2 py-1 rounded-full hover:bg-black/5 transition"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <StreakChip streak={streak} celebrate={newBest} />
        </div>
      </header>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-black/50">Loading…</div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => fetchNext()}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-full"
          >
            Try again
          </button>
        </div>
      )}

      {exhausted && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-6xl">🎉</p>
          <h2
            className="text-4xl sm:text-5xl font-black text-red-600 leading-tight"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.12)" }}
          >
            You got {correct} out of {total}!
          </h2>
          {scoreSubtitle && (
            <p className="text-xl font-bold text-black/70">{scoreSubtitle}</p>
          )}
          {bestStreak > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10">
              <span className="text-xl">🔥</span>
              <span className="font-bold text-red-600">
                Best streak: {bestStreak}
              </span>
            </div>
          )}
          <button
            onClick={restart}
            className="mt-2 px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-full shadow-lg active:scale-95 transition uppercase tracking-wide"
          >
            Play again
          </button>
        </div>
      )}

      {question && !loading && !error && !exhausted && (
        <QuestionCard
          question={question}
          picked={picked}
          onPick={handlePick}
          onNext={() => fetchNext()}
          imageMode={imageMode}
          voteStats={voteStats}
        />
      )}
    </main>
  );
}

function StreakChip({ streak, celebrate }: { streak: number; celebrate: boolean }) {
  return (
    <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10">
      <span
        className={`text-lg transition-all duration-300 ${
          streak === 0 ? "opacity-30" : "opacity-100"
        } ${celebrate ? "scale-125" : "scale-100"}`}
        aria-hidden
      >
        🔥
      </span>
      <span
        key={streak}
        className="text-red-600 font-black text-base tabular-nums animate-[pop_300ms_ease-out]"
      >
        {streak}
      </span>
      {celebrate && (
        <span className="absolute -top-7 right-0 text-[10px] uppercase tracking-widest font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-600/30 whitespace-nowrap animate-[pop_400ms_ease-out]">
          New best!
        </span>
      )}
      <style>{`@keyframes pop { 0% { transform: scale(0.7) } 60% { transform: scale(1.15) } 100% { transform: scale(1) } }`}</style>
    </div>
  );
}

