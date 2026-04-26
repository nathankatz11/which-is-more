import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import QuestionForm, { type QuestionFormValues } from "../../components/QuestionForm";
import { updateQuestion } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [row] = await db.select().from(questions).where(eq(questions.slug, slug)).limit(1);
  if (!row) notFound();

  const initial: QuestionFormValues = {
    slug: row.slug,
    category: row.category,
    optionAText: row.optionAText,
    optionAValue: row.optionAValue,
    optionAEmoji: row.optionAEmoji ?? "",
    optionAImage: row.optionAImage ?? "",
    optionBText: row.optionBText,
    optionBValue: row.optionBValue,
    optionBEmoji: row.optionBEmoji ?? "",
    optionBImage: row.optionBImage ?? "",
    answer: row.answer,
    answerLabel: row.answerLabel,
    explanation: row.explanation,
    authored: row.authored,
    needsReview: row.needsReview,
  };

  const save = updateQuestion.bind(null, row.slug);

  return (
    <main className="flex-1 px-4 py-8 max-w-5xl w-full mx-auto">
      <Link
        href="/admin"
        className="text-red-600 font-bold text-sm uppercase tracking-widest mb-3 inline-block"
      >
        ← All questions
      </Link>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1 text-black/85">
        Edit question
      </h1>
      <p className="text-sm text-black/50 font-mono mb-8">{row.slug}</p>
      <QuestionForm action={save} initial={initial} submitLabel="Save changes" />
    </main>
  );
}
