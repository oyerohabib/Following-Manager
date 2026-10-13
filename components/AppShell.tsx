"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Import" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/following", label: "Following" },
  { href: "/queue", label: "Unfollow queue" },
  { href: "/settings", label: "Settings" },
];

function QueueCount() {
  const count = useLiveQuery(() => db.actions.where("status").equals("queued").count(), []);
  if (!count) return null;
  return (
    <span className="ml-1.5 rounded-full bg-ig-gradient px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="h-7 w-7 rounded-lg bg-ig-gradient" aria-hidden />
            <span className="hidden sm:inline">Following Manager</span>
          </Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
                  pathname === item.href ? "bg-white/10 text-white" : "text-muted hover:text-white",
                )}
              >
                {item.label}
                {item.href === "/queue" && <QueueCount />}
              </Link>
            ))}
          </nav>
          <span className="hidden text-xs text-muted md:inline">Data stays on this device</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
