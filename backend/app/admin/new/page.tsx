import Link from "next/link";
import QuestionForm, { emptyQuestion } from "../components/QuestionForm";
import { createQuestion } from "../actions";

export const dynamic = "force-dynamic";

export default function NewQuestionPage() {
  return (
    <main className="flex-1 px-4 py-8 max-w-5xl w-full mx-auto">
      <Link
        href="/admin"
        className="text-red-600 font-bold text-sm uppercase tracking-widest mb-3 inline-block"
      >
        ← All questions
      </Link>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-8 text-black/85">
        New question
      </h1>
      <QuestionForm action={createQuestion} initial={emptyQuestion} submitLabel="Save question" />
    </main>
  );
}
