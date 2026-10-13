"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cx } from "./ui";

const SUGGESTED = ["friend", "family", "brand", "creator", "news", "celebrity", "work"];

export function TagPicker({
  allTags,
  onSelect,
  label = "Tag",
  size = "sm",
  align = "left",
}: {
  allTags: string[];
  onSelect: (tag: string) => void;
  label?: string;
  size?: "sm" | "md";
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const options = [...new Set([...allTags, ...SUGGESTED])].filter((t) => t.includes(value.trim().toLowerCase()));

  const choose = (tag: string) => {
    if (!tag.trim()) return;
    onSelect(tag.trim().toLowerCase());
    setValue("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button size={size} onClick={() => setOpen((o) => !o)}>
        {label}
      </Button>
      {open && (
        <div
          className={cx(
            "absolute z-40 mt-2 w-56 rounded-xl border border-white/10 bg-[#1d1d26] p-2 shadow-2xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") choose(value);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="New or existing tag"
            className="mb-2 w-full rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-muted focus:bg-white/10"
          />
          <div className="max-h-48 overflow-y-auto">
            {options.map((tag) => (
              <button
                key={tag}
                onClick={() => choose(tag)}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-white hover:bg-white/8"
              >
                {tag}
              </button>
            ))}
            {value.trim() && !options.includes(value.trim().toLowerCase()) && (
              <button
                onClick={() => choose(value)}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-fuchsia-300 hover:bg-white/8"
              >
                Create &quot;{value.trim().toLowerCase()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
