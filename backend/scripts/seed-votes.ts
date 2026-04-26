/**
 * Seeds the `question_votes` table with realistic-looking social proof counts.
 * Idempotent: upserts by (question_id, option). Safe to re-run.
 *
 * Usage: npm run db:seed-votes
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { questions, questionVotes } from "../lib/db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
for (const envFile of [".env.local", ".env"]) {
  try {
    const text = readFileSync(resolve(__dirname, "..", envFile), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch { /* ignore missing */ }
}

// Crowd splits per question.
// Most questions have the crowd picking wrong — that's what makes it fun.
const VOTE_SEEDS: Record<string, { votesA: number; votesB: number }> = {
  "gum-vs-skin":             { votesA:  892, votesB: 1148 }, // crowd picks B (wrong — A is correct)
  "m-states-vs-face-cards":  { votesA: 1340, votesB:  862 }, // crowd picks A (wrong — B is correct)
  "nickels-vs-freds":        { votesA:  938, votesB:  674 }, // crowd picks A (wrong — B is correct)
  "threes-vs-foul-balls":    { votesA: 1310, votesB:  618 }, // crowd picks A (wrong — B is correct)
  "tv-teens-vs-seniors":     { votesA: 1604, votesB:  631 }, // crowd picks A (wrong — B is correct)
  "soda-vs-snot":            { votesA: 1218, votesB:  449 }, // crowd picks A (wrong — B is correct)
  "diapers-vs-pizza":        { votesA:  732, votesB:  894 }, // crowd picks B (correct!)
  "tp-sheets-vs-family-water":{ votesA: 1088, votesB:  806 }, // crowd picks A (wrong — B is correct)
  "batteries-vs-hippo":      { votesA: 1094, votesB:  638 }, // crowd picks A (wrong — B is correct)
  "cow-vs-kid-milk":         { votesA: 1122, votesB:  978 }, // crowd picks A (correct!)
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  }
  const db = getDb();
  let count = 0;

  for (const [slug, { votesA, votesB }] of Object.entries(VOTE_SEEDS)) {
    const rows = await db.select({ id: questions.id }).from(questions).where(eq(questions.slug, slug)).limit(1);
    if (rows.length === 0) {
      console.warn(`  ⚠ Skipping "${slug}" — not found in DB`);
      continue;
    }
    const questionId = rows[0].id;

    for (const [option, count_] of [["A", votesA], ["B", votesB]] as const) {
      await db
        .insert(questionVotes)
        .values({ questionId, option, count: count_ })
        .onConflictDoUpdate({
          target: [questionVotes.questionId, questionVotes.option],
          set: { count: sql`${questionVotes.count} + ${count_}` },
        });
    }

    const total = votesA + votesB;
    const pctA = Math.round((votesA / total) * 100);
    console.log(`  ✓ ${slug}: A ${pctA}% / B ${100 - pctA}%  (${total.toLocaleString()} players)`);
    count++;
  }

  console.log(`\nSeeded votes for ${count} questions.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
