"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { questions, categoryEnum } from "@/lib/db/schema";

// Schema shared between create + update. All strings are trimmed; emoji
// and image default to null when the field is blank.
const questionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  category: z.enum(categoryEnum.enumValues),
  optionAText: z.string().trim().min(2),
  optionAValue: z.string().trim().min(1),
  optionAEmoji: z.string().trim().optional().default(""),
  optionAImage: z.string().trim().optional().default(""),
  optionBText: z.string().trim().min(2),
  optionBValue: z.string().trim().min(1),
  optionBEmoji: z.string().trim().optional().default(""),
  optionBImage: z.string().trim().optional().default(""),
  answer: z.enum(["A", "B"]),
  answerLabel: z.string().trim().min(1),
  explanation: z.string().trim().min(5),
  authored: z.boolean(),
  needsReview: z.boolean(),
});

function parse(formData: FormData) {
  return questionSchema.parse({
    slug: formData.get("slug"),
    category: formData.get("category"),
    optionAText: formData.get("optionAText"),
    optionAValue: formData.get("optionAValue"),
    optionAEmoji: formData.get("optionAEmoji") ?? "",
    optionAImage: formData.get("optionAImage") ?? "",
    optionBText: formData.get("optionBText"),
    optionBValue: formData.get("optionBValue"),
    optionBEmoji: formData.get("optionBEmoji") ?? "",
    optionBImage: formData.get("optionBImage") ?? "",
    answer: formData.get("answer"),
    answerLabel: formData.get("answerLabel"),
    explanation: formData.get("explanation"),
    authored: formData.get("authored") === "on",
    needsReview: formData.get("needsReview") === "on",
  });
}

export async function createQuestion(formData: FormData) {
  const input = parse(formData);
  await db.insert(questions).values({
    slug: input.slug,
    category: input.category,
    optionAText: input.optionAText,
    optionAValue: input.optionAValue,
    optionAEmoji: input.optionAEmoji || null,
    optionAImage: input.optionAImage || null,
    optionBText: input.optionBText,
    optionBValue: input.optionBValue,
    optionBEmoji: input.optionBEmoji || null,
    optionBImage: input.optionBImage || null,
    answer: input.answer,
    answerLabel: input.answerLabel,
    explanation: input.explanation,
    authored: input.authored,
    needsReview: input.needsReview,
  });
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateQuestion(originalSlug: string, formData: FormData) {
  const input = parse(formData);
  await db
    .update(questions)
    .set({
      slug: input.slug,
      category: input.category,
      optionAText: input.optionAText,
      optionAValue: input.optionAValue,
      optionAEmoji: input.optionAEmoji || null,
      optionAImage: input.optionAImage || null,
      optionBText: input.optionBText,
      optionBValue: input.optionBValue,
      optionBEmoji: input.optionBEmoji || null,
      optionBImage: input.optionBImage || null,
      answer: input.answer,
      answerLabel: input.answerLabel,
      explanation: input.explanation,
      authored: input.authored,
      needsReview: input.needsReview,
      updatedAt: new Date(),
    })
    .where(eq(questions.slug, originalSlug));
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteQuestion(slug: string) {
  await db.delete(questions).where(eq(questions.slug, slug));
  revalidatePath("/admin");
  revalidatePath("/");
}
