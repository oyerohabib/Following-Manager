"use client";

import { enqueue } from "@/lib/db";
import { formatAge, formatDate, profileUrl } from "@/lib/format";
import { Avatar, Button } from "./ui";

export interface MiniItem {
  username: string;
  date?: number;
  canQueue?: boolean;
  queued?: boolean;
}

export function AccountMiniList({ items, empty }: { items: MiniItem[]; empty: string }) {
  if (items.length === 0) return <p className="py-4 text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-white/5">
      {items.map((item) => (
        <li key={item.username} className="flex items-center gap-3 py-2">
          <Avatar username={item.username} size={32} />
          <div className="min-w-0 flex-1">
            <a
              href={profileUrl(item.username)}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm font-medium text-white hover:underline"
            >
              {item.username}
            </a>
            {item.date && (
              <div className="text-xs text-muted">
                {formatDate(item.date)} ({formatAge(item.date)} ago)
              </div>
            )}
          </div>
          {item.canQueue && (
            <Button size="sm" variant={item.queued ? "ghost" : "secondary"} disabled={item.queued} onClick={() => enqueue([item.username])}>
              {item.queued ? "Queued" : "Queue"}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
