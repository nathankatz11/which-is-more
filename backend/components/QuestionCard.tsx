"use client";

import type { QuestionDTO } from "@/lib/questions";

type VoteStats = { votesA: number; votesB: number };

type Props = {
  question: QuestionDTO;
  picked: "A" | "B" | null;
  onPick: (choice: "A" | "B") => void;
  onNext: () => void;
  imageMode?: boolean;
  voteStats?: VoteStats | null;
};

export default function QuestionCard({
  question,
  picked,
  onPick,
  onNext,
  imageMode = false,
  voteStats,
}: Props) {
  const revealed = picked !== null;
  const aIsLosing = revealed && question.answer !== "A";
  const bIsLosing = revealed && question.answer !== "B";
  // Photo mode only kicks in when the question has image URLs populated.
  const useImageA = imageMode && !!question.optionA.image;
  const useImageB = imageMode && !!question.optionB.image;

  return (
    // key={} remounts the subtree on each new question, replaying entrance
    // animations cleanly without per-element orchestration.
    <div key={question.slug} className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      {/* Brand + prefix banner — enters first. Prefix hugs the tiles below
          intentionally (tight pb) so the reader's eye flows straight into
          the two options. */}
      <div className="shrink-0 px-4 pt-4 pb-2 sm:pt-5 sm:pb-3 text-center bg-red-50 border-b-2 border-red-600/15 animate-[slideDownIn_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <p
          className="text-red-600 font-black text-sm sm:text-base tracking-[0.2em] leading-none uppercase"
          style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.1)" }}
        >
          Which is more?
        </p>
        {question.prefix && (
          <p
            className="mt-2 text-black/85 font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight text-balance"
          >
            {question.prefix}…
          </p>
        )}
      </div>

      {/* Tiles — always side by side, regardless of viewport */}
      <div className="flex-1 flex flex-row min-h-0 min-w-0 relative">
        <Slot
          losing={aIsLosing}
          side="A"
          tile={
            <OptionHalf
              label="A"
              option={question.optionA}
              revealed={revealed}
              isCorrect={question.answer === "A"}
              onPick={() => !revealed && onPick("A")}
              useImage={useImageA}
            />
          }
          reveal={<RevealPanel question={question} picked={picked} onNext={onNext} voteStats={voteStats} />}
        />
        <Slot
          losing={bIsLosing}
          side="B"
          tile={
            <OptionHalf
              label="B"
              option={question.optionB}
              revealed={revealed}
              isCorrect={question.answer === "B"}
              onPick={() => !revealed && onPick("B")}
              useImage={useImageB}
            />
          }
          reveal={<RevealPanel question={question} picked={picked} onNext={onNext} voteStats={voteStats} />}
        />

        {/* Vertical divider + floating OR pill — only before a pick.
            Enters last in the stagger, after both tiles have settled. */}
        {!revealed && (
          <>
            <div
              aria-hidden
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-red-600/20 animate-[fadeIn_350ms_ease-out_1350ms_both]"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-[fadeIn_350ms_ease-out_1350ms_both]">
              <span className="inline-block px-2.5 py-1 text-[10px] font-black tracking-[0.3em] text-black/50 bg-white rounded-full border border-black/10 shadow-sm">
                OR
              </span>
            </div>
          </>
        )}

        <style>{`
          @keyframes riseIn {
            from { transform: translateY(8px); opacity: 0 }
            to   { transform: translateY(0);   opacity: 1 }
          }
          @keyframes stamp {
            0%   { transform: scale(0) rotate(-20deg); opacity: 0 }
            60%  { transform: scale(1.15) rotate(5deg); opacity: 1 }
            100% { transform: scale(1) rotate(0deg); opacity: 1 }
          }
          @keyframes explodeLeft  { to { transform: translateX(-700px) rotate(-20deg) scale(0.25); opacity: 0 } }
          @keyframes explodeRight { to { transform: translateX(700px)  rotate(20deg)  scale(0.25); opacity: 0 } }
          @keyframes revealIn     { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideDownIn {
            from { opacity: 0; transform: translateY(-14px) }
            to   { opacity: 1; transform: translateY(0) }
          }
          @keyframes slideInLeft {
            0%   { opacity: 0; transform: translateX(-80px) rotate(-4deg) scale(0.92) }
            70%  { opacity: 1 }
            100% { opacity: 1; transform: translateX(0) rotate(0deg) scale(1) }
          }
          @keyframes slideInRight {
            0%   { opacity: 0; transform: translateX(80px) rotate(4deg) scale(0.92) }
            70%  { opacity: 1 }
            100% { opacity: 1; transform: translateX(0) rotate(0deg) scale(1) }
          }
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        `}</style>
      </div>
    </div>
  );
}

function Slot({
  losing,
  side,
  tile,
  reveal,
}: {
  losing: boolean;
  side: "A" | "B";
  tile: React.ReactNode;
  reveal: React.ReactNode;
}) {
  // Staggered entrance with a beat for the reader to parse the prefix before
  // tiles swing in: banner (0ms) → tile A (750ms) → tile B (1000ms) → OR (1350ms).
  const entrance =
    side === "A"
      ? "animate-[slideInLeft_600ms_cubic-bezier(0.22,1,0.36,1)_750ms_both]"
      : "animate-[slideInRight_600ms_cubic-bezier(0.22,1,0.36,1)_1000ms_both]";
  if (!losing) {
    return <div className={`flex-1 min-h-0 min-w-0 flex ${entrance}`}>{tile}</div>;
  }
  const explode =
    side === "A"
      ? "animate-[explodeLeft_280ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
      : "animate-[explodeRight_280ms_cubic-bezier(0.22,1,0.36,1)_forwards]";
  return (
    <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden animate-[revealIn_280ms_ease-out_forwards]">
      {reveal}
      <div className={`absolute inset-0 z-10 pointer-events-none will-change-transform ${explode}`}>
        {tile}
      </div>
    </div>
  );
}

function OptionHalf({
  label,
  option,
  revealed,
  isCorrect,
  onPick,
  useImage,
}: {
  label: "A" | "B";
  option: QuestionDTO["optionA"];
  revealed: boolean;
  isCorrect: boolean;
  onPick: () => void;
  useImage: boolean;
}) {
  const glow =
    revealed && isCorrect
      ? "shadow-[inset_0_0_0_3px_#dc2626,0_0_40px_-5px_rgba(220,38,38,0.45)]"
      : "";
  // White cream background when emoji mode; image gets painted below as a
  // full-bleed cover with a darkening overlay for legibility.
  const bg = useImage
    ? "bg-black"
    : revealed && isCorrect
      ? "bg-red-50"
      : "bg-white";
  const textColor = useImage ? "text-white" : "text-black/85";
  const valueColor = useImage
    ? revealed && isCorrect
      ? "text-white"
      : "text-white/80"
    : revealed && isCorrect
      ? "text-red-600"
      : "text-black/85";
  // Capitalize the first letter of the tail so tiles read as standalone
  // statements even though the DB stores them lowercase after prefix split.
  const displayText = option.text
    ? option.text.charAt(0).toUpperCase() + option.text.slice(1)
    : option.text;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={revealed}
      aria-label={`Option ${label}: ${option.text}`}
      className={`flex-1 min-h-0 min-w-0 w-full h-full relative px-3 py-4 sm:px-6 sm:py-8 transition-[background-color,box-shadow] duration-300 ${bg} ${glow} ${
        revealed ? "cursor-default" : "active:brightness-110"
      }`}
    >
      {useImage && option.image && (
        <>
          {/* Full-bleed cover image */}
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${option.image})` }}
          />
          {/* Stronger dark overlay — the photo is context, not hero. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black/85"
          />
        </>
      )}
      <div className="relative z-10 max-w-xl mx-auto flex flex-col h-full items-center justify-start pt-6 sm:pt-8 text-center gap-4 sm:gap-6">
        {!useImage && option.emoji && (
          <div
            className={`text-7xl sm:text-8xl md:text-9xl leading-none select-none transition-transform duration-300 ${
              revealed && isCorrect ? "scale-110" : "scale-100"
            }`}
            aria-hidden
          >
            {option.emoji}
          </div>
        )}
        {/* In photo mode, wrap text+value in a frosted card so they're rock-solid
            legible over any image. In emoji mode, just render them plain. */}
        <div
          className={
            useImage
              ? "w-full bg-black/55 backdrop-blur-md rounded-2xl px-5 sm:px-7 py-5 sm:py-6 flex flex-col items-center gap-3"
              : "flex flex-col items-center gap-3"
          }
        >
          <p
            className={`font-black leading-tight text-balance ${textColor} ${
              useImage
                ? "text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_2px_12px_rgba(0,0,0,1)]"
                : "text-xl sm:text-2xl md:text-3xl font-bold"
            }`}
          >
            {displayText}
          </p>
          {revealed && isCorrect && (
            <p
              className={`font-black animate-[riseIn_320ms_cubic-bezier(0.2,0.8,0.2,1)_forwards] ${valueColor} ${
                useImage
                  ? "text-3xl sm:text-4xl md:text-5xl drop-shadow-[0_2px_12px_rgba(0,0,0,1)]"
                  : "text-2xl sm:text-3xl md:text-4xl"
              }`}
            >
              {option.value}
            </p>
          )}
        </div>
      </div>
      {revealed && isCorrect && (
        <span className="absolute z-10 top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-600 text-white font-black text-base sm:text-xl shadow-lg animate-[stamp_320ms_cubic-bezier(0.3,1.4,0.4,1)_forwards]">
          ✓
        </span>
      )}
    </button>
  );
}

function RevealPanel({
  question,
  picked,
  onNext,
  voteStats,
}: {
  question: QuestionDTO;
  picked: "A" | "B" | null;
  onNext: () => void;
  voteStats?: VoteStats | null;
}) {
  const isCorrect = picked === question.answer;
  const tone = isCorrect ? "bg-red-600 text-white" : "bg-[#F4A69E] text-[#1a1a1a]";
  const btn = isCorrect ? "bg-white text-red-600" : "bg-[#fff8f0] text-red-600";
  return (
    <div className={`h-full w-full flex flex-col justify-center p-4 sm:p-6 md:p-8 ${tone}`}>
      <div className="max-w-xl mx-auto w-full">
        {!isCorrect && (
          <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-black bg-red-700 text-white px-2 py-1 rounded mb-2">
            Wrong!
          </span>
        )}
        <p
          className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight"
          style={{ textShadow: isCorrect ? "2px 2px 0 rgba(0,0,0,0.18)" : "none" }}
        >
          {isCorrect ? "CORRECT!" : "ACTUALLY…"}
        </p>
        <VoteBars question={question} stats={voteStats ?? null} />
        <p
          className={`mt-3 text-xs sm:text-sm md:text-base leading-relaxed ${
            isCorrect ? "text-white/95" : "text-[#1a1a1a]/80"
          }`}
        >
          {question.explanation}
        </p>
        <button
          onClick={onNext}
          className={`mt-4 w-full font-extrabold text-base sm:text-lg rounded-2xl py-2.5 sm:py-3 active:scale-[0.99] transition ${btn}`}
        >
          Next question →
        </button>
      </div>
    </div>
  );
}

function VoteBars({
  question,
  stats,
}: {
  question: QuestionDTO;
  stats: VoteStats | null;
}) {
  const total = stats ? stats.votesA + stats.votesB : 0;
  const correctVotes = stats
    ? question.answer === "A" ? stats.votesA : stats.votesB
    : 0;
  const rightPct = total === 0 ? 0 : Math.round((correctVotes / total) * 100);
  const wrongPct = 100 - rightPct;

  return (
    <div className="mt-4 mb-1">
      {/* Headline */}
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70 mb-2">
        {stats
          ? `${rightPct}% of players got this right`
          : "Checking the crowd…"}
      </p>

      {/* Split bar — right (bright) | wrong (dim) */}
      <div className="h-2.5 rounded-full bg-white/15 overflow-hidden flex">
        <div
          className="h-full bg-white/85 transition-[width] duration-700 ease-out"
          style={{ width: stats ? `${rightPct}%` : "0%" }}
        />
      </div>

      {/* Labels beneath bar */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-bold text-white/80">
          ✓ {stats ? `${rightPct}%` : "—"} right
        </span>
        <span className="text-[10px] text-white/45 tabular-nums">
          {total > 0 ? `${total.toLocaleString()} players` : ""}
        </span>
        <span className="text-[10px] font-bold text-white/45">
          {stats ? `${wrongPct}%` : "—"} wrong ✗
        </span>
      </div>
    </div>
  );
}
