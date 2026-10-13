"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { addTag, dequeue, enqueue, removeTag, setKeep } from "@/lib/db";
import { formatAge, formatDate, profileUrl } from "@/lib/format";
import type { AccountRow } from "@/lib/types";
import { TagPicker } from "./TagPicker";
import { Avatar, Badge, Button, cx } from "./ui";

function RelationshipBadges({ row }: { row: AccountRow }) {
  return (
    <>
      {row.unfollowedHere && <Badge tone="gray">Unfollowed</Badge>}
      {row.iFollow && row.followsMe && <Badge tone="green">Mutual</Badge>}
      {row.iFollow && !row.followsMe && <Badge tone="red">Doesn&apos;t follow back</Badge>}
      {!row.iFollow && row.followsMe && <Badge tone="blue">Follows you</Badge>}
      {row.closeFriend && <Badge tone="purple">Close friend</Badge>}
      {row.keep && <Badge tone="amber">Keep</Badge>}
      {row.status === "queued" && row.iFollow && <Badge tone="purple">Queued</Badge>}
    </>
  );
}

export function AccountTable({
  rows,
  selected,
  onToggle,
  allTags,
}: {
  rows: AccountRow[];
  selected: Set<string>;
  onToggle: (username: string) => void;
  allTags: string[];
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 12,
  });

  if (rows.length === 0) {
    return <p className="rounded-2xl bg-surface py-16 text-center text-sm text-muted">No accounts match.</p>;
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-320px)] min-h-96 overflow-y-auto rounded-2xl border border-white/8 bg-surface">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];
          const isSelected = selected.has(row.username);
          const date = row.followedAt ?? row.followsMeSince;
          return (
            <div
              key={row.username}
              className={cx(
                "absolute left-0 flex w-full items-center gap-3 border-b border-white/5 px-4 focus-within:z-10",
                isSelected && "bg-fuchsia-500/8",
              )}
              style={{ height: item.size, transform: `translateY(${item.start}px)` }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(row.username)}
                aria-label={`Select ${row.username}`}
                className="h-4 w-4 accent-fuchsia-500"
              />
              <Avatar username={row.username} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={profileUrl(row.username)}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-semibold text-white hover:underline"
                  >
                    {row.username}
                  </a>
                  <RelationshipBadges row={row} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  {date && (
                    <span title={formatDate(date)}>
                      {row.followedAt ? "Followed" : "Follows you since"} {formatDate(date)} ({formatAge(date)})
                    </span>
                  )}
                  {row.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => removeTag([row.username], tag)}
                      title="Remove tag"
                      className="rounded-full bg-white/8 px-2 text-[11px] text-white hover:bg-rose-500/20"
                    >
                      #{tag} x
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                <TagPicker allTags={allTags} label="+ Tag" align="right" onSelect={(t) => addTag([row.username], t)} />
                {row.iFollow && (
                  <Button
                    size="sm"
                    variant={row.keep ? "secondary" : "ghost"}
                    onClick={() => setKeep([row.username], !row.keep)}
                    title="Never suggest unfollowing this account"
                  >
                    {row.keep ? "Kept" : "Keep"}
                  </Button>
                )}
                {row.iFollow && !row.keep && (
                  <Button
                    size="sm"
                    variant={row.status === "queued" ? "secondary" : "ghost"}
                    onClick={() => (row.status === "queued" ? dequeue([row.username]) : enqueue([row.username]))}
                  >
                    {row.status === "queued" ? "Unqueue" : "Queue"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
