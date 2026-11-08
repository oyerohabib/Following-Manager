"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { db } from "@/lib/db";
import { BrandMark } from "./BrandMark";
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

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className}>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
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
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuId = useId();
  // Close automatically when the route changes without an effect setState.
  const open = menuOpen && menuPath === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-white">
            <BrandMark size={28} className="shrink-0" />
            <span className="truncate">Following Manager</span>
          </Link>

          <NavLinks pathname={pathname} className="hidden flex-1 gap-1 md:flex" />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="max-w-[9.5rem] truncate text-right text-[11px] leading-tight text-muted sm:max-w-none sm:text-xs">
              Data stays on this device
            </span>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/8 hover:text-white md:hidden"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => {
                if (open) setMenuOpen(false);
                else {
                  setMenuPath(pathname);
                  setMenuOpen(true);
                }
              }}
            >
              <span className="relative block h-3.5 w-4" aria-hidden>
                <span
                  className={cx(
                    "absolute left-0 top-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out",
                    open ? "translate-y-[6px] rotate-45" : "translate-y-0 rotate-0",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 top-[6px] h-0.5 w-full rounded-full bg-current transition-all duration-200 ease-out",
                    open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
                  )}
                />
                <span
                  className={cx(
                    "absolute left-0 top-[12px] h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out",
                    open ? "translate-y-[-6px] -rotate-45" : "translate-y-0 rotate-0",
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={cx(
            "grid border-white/8 transition-[grid-template-rows,border-color] duration-300 ease-out md:hidden",
            open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t border-transparent",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cx(
                "mx-auto max-w-6xl transition-[opacity,transform] duration-300 ease-out",
                open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              )}
            >
              <NavLinks
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
                className="flex flex-col gap-1 px-4 py-3"
              />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
