import { sql, and, notInArray, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, categoryEnum } from "@/lib/db/schema";
import { toDTO } from "@/lib/questions";

type Category = (typeof categoryEnum.enumValues)[number];
const categorySet = new Set<string>(categoryEnum.enumValues);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exclude = searchParams.get("exclude");
  const categoryParam = searchParams.get("category");

  const excludeSlugs = exclude
    ? exclude.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const category: Category | null =
    categoryParam && categorySet.has(categoryParam) ? (categoryParam as Category) : null;

  const clauses: SQL[] = [];
  if (excludeSlugs.length > 0) clauses.push(notInArray(questions.slug, excludeSlugs));
  if (category) clauses.push(eq(questions.category, category));

  const rows = await db
    .select()
    .from(questions)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(sql`random()`)
    .limit(1);

  if (rows.length === 0) {
    // Tell the client the deck is empty for these filters so it can show the
    // "you've seen them all" state rather than an error.
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(category ? eq(questions.category, category) : undefined);
    const total = totalRow?.count ?? 0;
    return Response.json(
      { question: null, exhausted: total > 0, total },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(
    { question: toDTO(rows[0]) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
