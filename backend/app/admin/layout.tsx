import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="shrink-0 border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-red-600 font-extrabold text-lg tracking-tight"
            style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.1)" }}
          >
            WHICH IS MORE?
            <span className="ml-2 text-xs uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded align-middle">
              admin
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-black/60 hover:text-black px-3 py-1.5 rounded"
            >
              View site
            </Link>
            <form action="/admin/logout" method="POST">
              <button
                type="submit"
                className="text-black/60 hover:text-red-600 px-3 py-1.5 rounded font-semibold"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
