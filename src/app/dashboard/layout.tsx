import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            href="/dashboard"
            className="font-semibold text-slate-900 dark:text-slate-50"
          >
            Lifting Diary
          </Link>
          <UserButton />
        </div>
      </header>
      {children}
    </div>
  );
}
