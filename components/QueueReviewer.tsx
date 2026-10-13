"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { restoreAction, setKeep, setStatus } from "@/lib/db";
import { formatAge, formatDate, formatNumber, profileUrl } from "@/lib/format";
import { unfollowedToday } from "@/lib/metrics";
import type { AccountRow, Action, ActionStatus } from "@/lib/types";
import { Avatar, Badge, Button, Card, Kbd } from "./ui";

interface UndoEntry {
  previous: Action;
  username: string;
  wasKept: boolean;
}

function openProfile(username: string) {
  const tab = window.open(profileUrl(username), "ig-review");
  try {
    if (tab) tab.opener = null;
  } catch {
    // Cross-origin once navigated; nothing to clear.
  }
}

export function QueueReviewer({
  queue,
  actions,
  dailyLimit,
}: {
  queue: AccountRow[];
  actions: Action[];
  dailyLimit: number;
}) {
  const undoStack = useRef<UndoEntry[]>([]);
  const [reviewed, setReviewed] = useState(0);
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const current = queue[0];
  const actionMap = useMemo(() => new Map(actions.map((a) => [a.username, a])), [actions]);
  const today = unfollowedToday(actions);
  const overLimit = today >= dailyLimit;
  // Keys can arrive before the live query re-renders; one decision per account until it leaves the queue.
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const inQueue = new Set(queue.map((r) => r.username));
    for (const username of handled.current) if (!inQueue.has(username)) handled.current.delete(username);
  }, [queue]);

  const decide = useCallback(
    async (status: Exclude<ActionStatus, "queued">) => {
      if (!current || handled.current.has(current.username)) return;
      const previous = actionMap.get(current.username);
      if (!previous) return;
      handled.current.add(current.username);
      undoStack.current.push({ previous, username: current.username, wasKept: current.keep });
      setReviewed(undoStack.current.length);
      if (status === "kept") await setKeep([current.username], true);
      else await setStatus(current.username, status);
    },
    [current, actionMap],
  );

  const undoLast = useCallback(async () => {
    const last = undoStack.current.pop();
    if (!last) return;
    setReviewed(undoStack.current.length);
    handled.current.delete(last.username);
    if (!last.wasKept) await setKeep([last.username], false);
    await restoreAction(last.previous);
  }, []);

  const open = useCallback(() => {
    if (!current) return;
    openProfile(current.username);
    setOpenedFor(current.username);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select") || e.altKey || e.ctrlKey) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        undoLast();
        return;
      }
      if (e.metaKey) return;
      const handlers: Record<string, () => void> = {
        enter: open,
        o: open,
        u: () => decide("unfollowed"),
        k: () => decide("kept"),
        s: () => decide("skipped"),
      };
      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, decide, undoLast]);

  const total = reviewed + queue.length;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted">
            This session: <span className="font-semibold text-white">{reviewed}</span> of {formatNumber(total)} reviewed
          </span>
          <span className={overLimit ? "font-semibold text-amber-300" : "text-muted"}>
            Unfollowed today: {today} / {dailyLimit}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-ig-gradient transition-all" style={{ width: `${total ? (reviewed / total) * 100 : 0}%` }} />
        </div>
        {overLimit && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            You have reached your daily pace. Instagram may temporarily block unfollows when there are too many in a
            short time, so consider continuing tomorrow. You can change this limit in Settings.
          </p>
        )}
      </Card>

      {current ? (
        <Card className="flex flex-col items-center gap-5 py-10 text-center">
          <Avatar username={current.username} size={96} />
          <div>
            <a
              href={profileUrl(current.username)}
              target="ig-review"
              onClick={(e) => {
                e.preventDefault();
                open();
              }}
              className="text-2xl font-bold text-white hover:underline"
            >
              @{current.username}
            </a>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {current.followsMe ? <Badge tone="green">Follows you</Badge> : <Badge tone="red">Doesn&apos;t follow back</Badge>}
              {current.closeFriend && <Badge tone="purple">Close friend</Badge>}
              {current.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
            {current.followedAt && (
              <p className="mt-2 text-sm text-muted">
                You followed them on {formatDate(current.followedAt)} ({formatAge(current.followedAt)} ago)
              </p>
            )}
          </div>

          {openedFor === current.username ? (
            <p className="max-w-sm text-sm text-muted">
              Their profile is open in your Instagram tab. Tap <b className="text-white">Following</b>, then{" "}
              <b className="text-white">Unfollow</b>, then come back and press <Kbd>U</Kbd>.
            </p>
          ) : (
            <Button variant="primary" size="lg" onClick={open}>
              Open profile on Instagram <Kbd>O</Kbd>
            </Button>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => decide("unfollowed")} className="min-w-36">
              I unfollowed <Kbd>U</Kbd>
            </Button>
            <Button onClick={() => decide("kept")} className="min-w-36">
              Keep following <Kbd>K</Kbd>
            </Button>
            <Button variant="ghost" onClick={() => decide("skipped")}>
              Skip <Kbd>S</Kbd>
            </Button>
            <Button variant="ghost" onClick={undoLast} disabled={reviewed === 0}>
              Undo <Kbd>Z</Kbd>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="py-10 text-center">
          <h2 className="text-lg font-semibold text-white">Queue cleared</h2>
          <p className="mt-1 text-sm text-muted">
            {reviewed > 0 ? `You reviewed ${reviewed} accounts this session.` : "Nothing is queued right now."}
          </p>
          {reviewed > 0 && (
            <Button variant="ghost" className="mt-3" onClick={undoLast}>
              Undo last <Kbd>Z</Kbd>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
