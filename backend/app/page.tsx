import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getQuestionCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions);
  return row?.count ?? 0;
}

export default async function Home() {
  const total = await getQuestionCount();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <h1
        className="text-red-600 font-extrabold tracking-tight leading-none text-6xl sm:text-7xl md:text-8xl"
        style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.12)" }}
      >
        WHICH IS MORE?
      </h1>
      <p className="mt-4 text-lg sm:text-xl text-black/70 max-w-md">
        A game by <span className="font-bold">Alan Katz</span>. Pick the bigger
        one, flip to find out.
      </p>

      <Link
        href="/play"
        className="mt-10 inline-block px-14 py-5 bg-red-600 text-white text-2xl font-extrabold rounded-full shadow-lg hover:bg-red-700 active:scale-95 transition uppercase tracking-wide"
      >
        Play
      </Link>

      {total > 0 && (
        <p className="mt-6 text-sm text-black/40">{total} questions</p>
      )}
    </main>
  );
}
