import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, hashPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const entered = (formData.get("password") ?? "").toString();
  const next = (formData.get("next") ?? "/admin").toString();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || entered !== expected) {
    redirect("/admin/login?error=1");
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await hashPassword(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * ADMIN_SESSION_DAYS,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-red-600 font-bold text-sm uppercase tracking-widest block mb-8">
          ← Back
        </Link>
        <h1
          className="text-red-600 font-extrabold leading-none text-4xl mb-2"
          style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.12)" }}
        >
          Admin
        </h1>
        <p className="text-black/60 mb-6">Enter the admin password to manage questions.</p>

        <form action={login} className="space-y-3">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <label className="block">
            <span className="text-xs uppercase tracking-widest font-bold text-black/50">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoFocus
              required
              autoComplete="current-password"
              className="mt-1 w-full border-2 border-black/10 focus:border-red-600 rounded-xl px-4 py-3 font-medium outline-none transition"
            />
          </label>
          {error && (
            <p className="text-red-600 text-sm font-semibold">Wrong password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-extrabold py-3 rounded-xl transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
