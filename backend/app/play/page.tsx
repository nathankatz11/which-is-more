import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, categoryEnum } from "@/lib/db/schema";
import { toDTO } from "@/lib/questions";
import PlayGame from "./play-game";

type Category = (typeof categoryEnum.enumValues)[number];
const categorySet = new Set<string>(categoryEnum.enumValues);

// Each visit picks a fresh random question — opt out of static rendering.
export const dynamic = "force-dynamic";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category: Category | null =
    rawCategory && categorySet.has(rawCategory) ? (rawCategory as Category) : null;

  const rows = await db
    .select()
    .from(questions)
    .where(category ? eq(questions.category, category) : undefined)
    .orderBy(sql`random()`)
    .limit(1);
  const initial = rows[0] ? toDTO(rows[0]) : null;
  return <PlayGame initial={initial} category={category} />;
}
