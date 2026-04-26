/**
 * Seeds the `questions` table from ../data/questions.json.
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Usage: npm run db:seed
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "../lib/db";
import { questions, type NewQuestion } from "../lib/db/schema";

// Load .env.local if present so DATABASE_URL is available when run via `npm run db:seed`.
// tsx doesn't auto-load env files; we read them here without adding a dotenv dep.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
for (const envFile of [".env.local", ".env"]) {
  try {
    const text = readFileSync(resolve(__dirname, "..", envFile), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // ignore missing file
  }
}

type RawQuestion = {
  id: string;
  category: string;
  optionA: { text: string; value: string; image?: string; emoji?: string };
  optionB: { text: string; value: string; image?: string; emoji?: string };
  answer: "A" | "B";
  answerLabel: string;
  explanation: string;
  authored: boolean;
  needsReview: boolean;
};

type RawFile = {
  meta?: unknown;
  questions: RawQuestion[];
};

async function main() {
  const path = resolve(__dirname, "..", "..", "data", "questions.json");
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as RawFile;
  const db = getDb();

  let count = 0;
  for (const q of raw.questions) {
    const row: NewQuestion = {
      slug: q.id,
      category: q.category as NewQuestion["category"],
      optionAText: q.optionA.text,
      optionAValue: q.optionA.value,
      optionAImage: q.optionA.image ?? null,
      optionAEmoji: q.optionA.emoji ?? null,
      optionBText: q.optionB.text,
      optionBValue: q.optionB.value,
      optionBImage: q.optionB.image ?? null,
      optionBEmoji: q.optionB.emoji ?? null,
      answer: q.answer,
      answerLabel: q.answerLabel,
      explanation: q.explanation,
      authored: q.authored,
      needsReview: q.needsReview,
      updatedAt: new Date(),
    };

    await db
      .insert(questions)
      .values(row)
      .onConflictDoUpdate({
        target: questions.slug,
        set: {
          category: row.category,
          optionAText: row.optionAText,
          optionAValue: row.optionAValue,
          optionAImage: row.optionAImage,
          optionAEmoji: row.optionAEmoji,
          optionBText: row.optionBText,
          optionBValue: row.optionBValue,
          optionBImage: row.optionBImage,
          optionBEmoji: row.optionBEmoji,
          answer: row.answer,
          answerLabel: row.answerLabel,
          explanation: row.explanation,
          authored: row.authored,
          needsReview: row.needsReview,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  console.log(`Seeded ${count} questions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
