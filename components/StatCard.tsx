import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./ui";

export function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={cx("mt-2 text-3xl font-bold", accent ? "text-ig-gradient" : "text-white")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </>
  );
  const className = "block rounded-2xl border border-white/8 bg-surface p-5 transition";
  return href ? (
    <Link href={href} className={cx(className, "hover:border-white/20 hover:bg-white/[0.04]")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
