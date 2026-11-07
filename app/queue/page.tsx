"use client";

import Link from "next/link";
import { useMemo } from "react";
import { QueueReviewer } from "@/components/QueueReviewer";
import { Avatar, Button, Card, CardTitle, Kbd, NoDataYet } from "@/components/ui";
import { DEFAULT_DAILY_LIMIT, dequeue, enqueue } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { useAppData, useSetting } from "@/lib/hooks";

export default function QueuePage() {
  const { loading, latest, rows, actions } = useAppData();
  const [dailyLimit] = useSetting("dailyLimit", DEFAULT_DAILY_LIMIT);

  const queuedAt = useMemo(() => new Map(actions.map((a) => [a.username, a.queuedAt])), [actions]);
  const queue = useMemo(
    () =>
      rows
        .filter((r) => r.iFollow && r.status === "queued")
        .sort((a, b) => (queuedAt.get(a.username) ?? 0) - (queuedAt.get(b.username) ?? 0)),
    [rows, queuedAt],
  );
  const skipped = useMemo(() => rows.filter((r) => r.iFollow && r.status === "skipped"), [rows]);
  const notFollowingBack = useMemo(
    () => rows.filter((r) => r.iFollow && !r.followsMe && !r.keep && !r.status),
    [rows],
  );

  if (loading) return null;
  if (!latest) return <NoDataYet />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Unfollow queue</h1>
        <p className="max-w-2xl text-sm text-muted">
          Each profile opens in one reusable Instagram tab. You tap Unfollow there yourself, then record it here. The
          app never unfollows on your behalf, which keeps your account within Instagram&apos;s rules.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <QueueReviewer queue={queue} actions={actions} dailyLimit={dailyLimit} />

        <div className="space-y-4">
          <Card>
            <CardTitle
              action={
                queue.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => dequeue(queue.map((r) => r.username))}>
                    Clear
                  </Button>
                )
              }
            >
              Up next ({formatNumber(Math.max(queue.length - 1, 0))})
            </CardTitle>
            {queue.length <= 1 ? (
              <p className="text-sm text-muted">Nothing else queued.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {queue.slice(1, 51).map((r) => (
                  <li key={r.username} className="flex items-center gap-2 text-sm">
                    <Avatar username={r.username} size={24} />
                    <span className="flex-1 truncate text-white">{r.username}</span>
                    <button onClick={() => dequeue([r.username])} className="text-xs text-muted hover:text-white">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 text-sm">
            <CardTitle>Add more</CardTitle>
            <Button
              className="w-full"
              disabled={notFollowingBack.length === 0}
              onClick={() => enqueue(notFollowingBack.map((r) => r.username))}
            >
              Queue all {formatNumber(notFollowingBack.length)} not following back
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              disabled={skipped.length === 0}
              onClick={() => enqueue(skipped.map((r) => r.username))}
            >
              Requeue {formatNumber(skipped.length)} skipped
            </Button>
            <Link href="/following?tab=notFollowingBack" className="block text-center text-xs text-muted hover:text-white">
              Or pick accounts one by one
            </Link>
            <p className="text-xs text-muted">Accounts you marked Keep are never added automatically.</p>
          </Card>

          <Card className="text-xs text-muted">
            <CardTitle>Shortcuts</CardTitle>
            <ul className="space-y-1.5">
              <li><Kbd>O</Kbd> or <Kbd>Enter</Kbd> open the profile on Instagram</li>
              <li><Kbd>U</Kbd> mark as unfollowed</li>
              <li><Kbd>K</Kbd> keep following, never suggest again</li>
              <li><Kbd>S</Kbd> skip for now</li>
              <li><Kbd>G</Kbd> mark as gone (deleted or unavailable)</li>
              <li><Kbd>Z</Kbd> undo</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
