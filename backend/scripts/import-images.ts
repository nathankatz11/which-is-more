/**
 * Reads ../data/image-urls.csv and updates the `optionAImage` / `optionBImage`
 * columns for each question. Idempotent — re-runs replace whatever's there.
 *
 * Usage: npm run db:import-images
 *
 * CSV columns expected (header row):
 *   slug, option (A|B), subject, suggested_search, image_url, notes
 * Rows with an empty image_url are skipped.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { questions } from "../lib/db/schema";

// Load .env.local the same way seed.ts does.
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

/// Minimal CSV parser that handles quoted fields with embedded commas and
/// the `""` escape for literal quotes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < rawLine.length; i++) {
      const c = rawLine[i];
      if (c === '"' && inQuotes && rawLine[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        row.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  }
  const csvPath = resolve(__dirname, "..", "..", "data", "image-urls.csv");
  const text = readFileSync(csvPath, "utf8");
  const rows = parseCSV(text);
  const [header, ...data] = rows;
  const idx = {
    slug: header.indexOf("slug"),
    option: header.indexOf("option"),
    url: header.indexOf("image_url"),
    notes: header.indexOf("notes"),
  };
  if (idx.slug < 0 || idx.option < 0 || idx.url < 0) {
    throw new Error("CSV is missing required columns (slug, option, image_url).");
  }

  const db = getDb();
  let updated = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const row of data) {
    const slug = row[idx.slug]?.trim();
    const option = row[idx.option]?.trim();
    const url = row[idx.url]?.trim();
    const notes = row[idx.notes]?.trim() ?? "";
    if (!slug || !option || !url) {
      skipped++;
      continue;
    }
    if (option !== "A" && option !== "B") {
      warnings.push(`Row ${slug}/${option}: option must be A or B — skipped.`);
      skipped++;
      continue;
    }
    // TIFF won't render in Chrome/Firefox/Edge. Skip rather than ship a broken image.
    if (/\.tiff?$/i.test(url)) {
      warnings.push(
        `Row ${slug}/${option}: TIFF URLs don't render in most browsers — skipped. (${url})`
      );
      skipped++;
      continue;
    }

    if (option === "A") {
      await db
        .update(questions)
        .set({ optionAImage: url, updatedAt: new Date() })
        .where(eq(questions.slug, slug));
    } else {
      await db
        .update(questions)
        .set({ optionBImage: url, updatedAt: new Date() })
        .where(eq(questions.slug, slug));
    }
    updated++;
    if (notes) {
      console.log(`  · ${slug}/${option} updated (note: ${notes})`);
    } else {
      console.log(`  · ${slug}/${option} updated`);
    }
  }

  console.log(`\nUpdated ${updated}, skipped ${skipped}.`);
  if (warnings.length) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  ! ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
