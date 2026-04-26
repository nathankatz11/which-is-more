import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { deleteQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  const rows = await db.select().from(questions).orderBy(desc(questions.updatedAt));
  const needsReview = rows.filter((r) => r.needsReview);

  return (
    <main className="flex-1 px-4 py-8 max-w-5xl w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-black/85 tracking-tight">
            Questions
          </h1>
          <p className="text-sm text-black/60 mt-1">
            {rows.length} total
            {needsReview.length > 0 && (
              <>
                {" · "}
                <span className="text-red-600 font-bold">
                  {needsReview.length} need review
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/admin/new"
          className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-3 rounded-xl shadow-sm active:scale-[0.98] transition"
        >
          + New question
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-black/50 py-20">
          No questions yet. Add your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((q) => (
            <div
              key={q.id}
              className="bg-white border-2 border-black/5 rounded-2xl p-5 hover:border-red-600/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs uppercase tracking-widest font-bold text-black/40">
                      {q.category.replace(/_/g, " ")}
                    </span>
                    {q.needsReview && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Needs review
                      </span>
                    )}
                    {q.authored && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Authored
                      </span>
                    )}
                    <code className="text-[11px] text-black/30 font-mono">{q.slug}</code>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MiniTile
                      letter="A"
                      text={q.optionAText}
                      value={q.optionAValue}
                      emoji={q.optionAEmoji}
                      isAnswer={q.answer === "A"}
                    />
                    <MiniTile
                      letter="B"
                      text={q.optionBText}
                      value={q.optionBValue}
                      emoji={q.optionBEmoji}
                      isAnswer={q.answer === "B"}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/admin/${q.slug}/edit`}
                    className="text-sm text-red-600 font-bold hover:underline px-3 py-1.5"
                  >
                    Edit
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteQuestion(q.slug);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-black/40 hover:text-red-600 px-3 py-1.5 font-semibold"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function MiniTile({
  letter,
  text,
  value,
  emoji,
  isAnswer,
}: {
  letter: "A" | "B";
  text: string;
  value: string;
  emoji: string | null;
  isAnswer: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border-2 ${
        isAnswer ? "bg-red-50 border-red-600/30" : "bg-black/[0.02] border-transparent"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-white font-extrabold text-sm shrink-0 ${
            isAnswer ? "bg-red-600" : "bg-black/30"
          }`}
        >
          {letter}
        </span>
        {emoji && (
          <span className="text-2xl leading-none" aria-hidden>
            {emoji}
          </span>
        )}
        <div className="text-sm min-w-0">
          <p className="font-semibold text-black/80 line-clamp-2">{text}</p>
          <p className="text-xs text-black/50 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
