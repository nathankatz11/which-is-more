import type { Question } from "./db/schema";

export type QuestionDTO = {
  id: string;
  slug: string;
  category: string;
  /// Shared lead-in pulled out of both prompts (e.g. "The number of pounds of")
  /// so clients can render it once as a header and show only the differing
  /// tail on each tile. Null when the prompts don't share enough words.
  prefix: string | null;
  optionA: { text: string; value: string; image: string | null; emoji: string | null };
  optionB: { text: string; value: string; image: string | null; emoji: string | null };
  answer: "A" | "B";
  answerLabel: string;
  explanation: string;
  authored: boolean;
  needsReview: boolean;
};

/// Returns the shared word-aligned prefix of two strings and the remaining
/// tail of each. Falls back to (null, a, b) if the prefix has fewer than
/// three words — short prefixes aren't worth pulling out.
function splitCommonPrefix(a: string, b: string): {
  prefix: string | null;
  restA: string;
  restB: string;
} {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  // Trim back to the last space so we don't split mid-word.
  let end = i;
  while (end > 0 && a[end - 1] !== " ") end--;
  const prefix = a.slice(0, end).trim();
  const words = prefix.split(/\s+/).filter(Boolean).length;
  if (words < 3) return { prefix: null, restA: a, restB: b };
  return { prefix, restA: a.slice(end).trim(), restB: b.slice(end).trim() };
}

export function toDTO(q: Question): QuestionDTO {
  const { prefix, restA, restB } = splitCommonPrefix(q.optionAText, q.optionBText);
  return {
    id: q.id,
    slug: q.slug,
    category: q.category,
    prefix,
    optionA: {
      text: restA,
      value: q.optionAValue,
      image: q.optionAImage,
      emoji: q.optionAEmoji,
    },
    optionB: {
      text: restB,
      value: q.optionBValue,
      image: q.optionBImage,
      emoji: q.optionBEmoji,
    },
    answer: q.answer,
    answerLabel: q.answerLabel,
    explanation: q.explanation,
    authored: q.authored,
    needsReview: q.needsReview,
  };
}
