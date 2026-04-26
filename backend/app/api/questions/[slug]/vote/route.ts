import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { questions, questionVotes } from "@/lib/db/schema";

const bodySchema = z.object({ option: z.enum(["A", "B"]) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "option must be A or B" }, { status: 400 });
  }
  const { option } = parsed.data;

  const rows = await db.select({ id: questions.id }).from(questions).where(eq(questions.slug, slug)).limit(1);
  if (rows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { id: questionId } = rows[0];

  await db
    .insert(questionVotes)
    .values({ questionId, option, count: 1 })
    .onConflictDoUpdate({
      target: [questionVotes.questionId, questionVotes.option],
      set: { count: sql`${questionVotes.count} + 1` },
    });

  const counts = await db.select().from(questionVotes).where(eq(questionVotes.questionId, questionId));
  const votesA = counts.find((r) => r.option === "A")?.count ?? 0;
  const votesB = counts.find((r) => r.option === "B")?.count ?? 0;

  return Response.json({ votesA, votesB });
}
