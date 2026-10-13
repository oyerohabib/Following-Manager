import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border border-white/8 bg-surface p-5", className)}>{children}</div>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white">{children}</h2>
      {action}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ig-gradient text-white hover:brightness-110",
  secondary: "bg-white/8 text-white hover:bg-white/14",
  ghost: "text-muted hover:bg-white/8 hover:text-white",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

const BADGE_TONES = {
  green: "bg-emerald-500/15 text-emerald-300",
  red: "bg-rose-500/15 text-rose-300",
  blue: "bg-sky-500/15 text-sky-300",
  amber: "bg-amber-500/15 text-amber-300",
  purple: "bg-fuchsia-500/15 text-fuchsia-300",
  gray: "bg-white/8 text-muted",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

function hue(username: string) {
  let h = 0;
  for (const ch of username) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function Avatar({ username, size = 40 }: { username: string; size?: number }) {
  const h = hue(username);
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white uppercase"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 40%))`,
      }}
    >
      {username.replace(/[^a-z0-9]/gi, "").charAt(0) || "?"}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="max-w-md text-sm text-muted">{children}</div>
    </Card>
  );
}

export function NoDataYet() {
  return (
    <EmptyState title="No export imported yet">
      <p className="mb-4">Import your Instagram data export to see who you follow and who follows you back.</p>
      <Link href="/" className="inline-flex rounded-xl bg-ig-gradient px-4 py-2 text-sm font-semibold text-white">
        Import your data
      </Link>
    </EmptyState>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  );
}
