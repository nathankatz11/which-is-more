import { type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, categoryEnum } from "@/lib/db/schema";
import { toDTO } from "@/lib/questions";

const querySchema = z.object({
  category: z.enum(categoryEnum.enumValues).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    category: request.nextUrl.searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }

  const { category } = parsed.data;

  const rows = category
    ? await db.select().from(questions).where(eq(questions.category, category))
    : await db.select().from(questions);

  return Response.json({ questions: rows.map(toDTO) });
}
