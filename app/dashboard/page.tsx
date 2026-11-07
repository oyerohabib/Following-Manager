"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AccountMiniList } from "@/components/AccountMiniList";
import { FollowChart } from "@/components/FollowChart";
import { StatCard } from "@/components/StatCard";
import { Button, Card, CardTitle, NoDataYet } from "@/components/ui";
import { enqueue } from "@/lib/db";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { useAppData } from "@/lib/hooks";
import { computeStats, diffSnapshots, oldestNonReciprocal, recentFollows, tagBreakdown } from "@/lib/metrics";
import type { AccountRow } from "@/lib/types";

function toItems(rows: AccountRow[]) {
  return rows.map((r) => ({
    username: r.username,
    date: r.followedAt,
    canQueue: r.iFollow,
    queued: r.status === "queued",
  }));
}

function DiffList({ title, names, tone }: { title: string; names: string[]; tone: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted">{title}</span>
        <span className={`font-semibold ${tone}`}>{names.length}</span>
      </div>
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        {names.map((n) => (
          <a
            key={n}
            href={`https://www.instagram.com/${n}/`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white/6 px-2 py-0.5 text-xs text-white hover:bg-white/12"
          >
            {n}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { loading, latest, previous, rows } = useAppData();

  const stats = useMemo(() => (latest ? computeStats(rows, latest) : null), [rows, latest]);
  const oldest = useMemo(() => oldestNonReciprocal(rows, 8), [rows]);
  const recent = useMemo(() => recentFollows(rows, 8), [rows]);
  const tags = useMemo(() => tagBreakdown(rows), [rows]);
  const diff = useMemo(() => (latest && previous ? diffSnapshots(previous, latest) : null), [latest, previous]);

  if (loading) return null;
  if (!latest || !stats) return <NoDataYet />;

  const queueableOldest = oldest.filter((r) => r.status !== "queued").map((r) => r.username);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-muted">
            From {latest.sourceName}, imported {formatDate(latest.importedAt)}
          </p>
          <p className="mt-1 max-w-xl text-xs text-muted">
            Export counts can include deleted accounts that Instagram&apos;s live Following number hides. Mark them as{" "}
            <Link href="/following?tab=gone" className="text-white underline-offset-2 hover:underline">
              Gone
            </Link>{" "}
            in Following or the unfollow queue to exclude them
            {stats.gone > 0 ? ` (${formatNumber(stats.gone)} marked)` : ""}.
          </p>
        </div>
        <Link href="/following?tab=notFollowingBack" className="rounded-xl bg-ig-gradient px-4 py-2 text-sm font-semibold text-white">
          Review who doesn&apos;t follow back
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Following" value={formatNumber(stats.following)} href="/following?tab=following" />
        <StatCard label="Followers" value={formatNumber(stats.followers)} />
        <StatCard label="Mutuals" value={formatNumber(stats.mutuals)} href="/following?tab=mutual" />
        <StatCard
          label="Not following back"
          value={formatNumber(stats.notFollowingBack)}
          href="/following?tab=notFollowingBack"
          accent
        />
        <StatCard
          label="Fans"
          value={formatNumber(stats.fans)}
          hint="Follow you, you don't follow them"
          href="/following?tab=fans"
        />
        <StatCard
          label="Follow-back rate"
          value={formatPercent(stats.followBackRatio)}
          hint={`${stats.followerToFollowingRatio.toFixed(2)} followers per following`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Close friends"
          value={formatNumber(stats.closeFriends)}
          hint={stats.closeFriends ? `${stats.closeFriendsFollowingBack} follow you back` : undefined}
        />
        <StatCard label="Pending requests" value={formatNumber(stats.pendingRequests)} hint="Private accounts you requested" />
        <StatCard
          label="Unfollowed here"
          value={formatNumber(stats.unfollowedHere)}
          hint={`${stats.queued} queued, ${stats.kept} kept`}
          href="/queue"
        />
        <StatCard
          label="Gone"
          value={formatNumber(stats.gone)}
          hint="Deleted or unavailable profiles"
          href="/following?tab=gone"
        />
        <StatCard
          label="Busiest month"
          value={stats.busiestMonth?.period ?? "-"}
          hint={stats.busiestMonth ? `${stats.busiestMonth.count} new follows` : undefined}
        />
      </div>

      <FollowChart rows={rows} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle
            action={
              queueableOldest.length > 0 && (
                <Button size="sm" onClick={() => enqueue(queueableOldest)}>
                  Queue all {queueableOldest.length}
                </Button>
              )
            }
          >
            Oldest follows that never followed back
          </CardTitle>
          <AccountMiniList items={toItems(oldest)} empty="Everyone you follow follows you back." />
        </Card>
        <Card>
          <CardTitle>Most recent follows</CardTitle>
          <AccountMiniList items={toItems(recent)} empty="No follow dates in this export." />
        </Card>
        <Card>
          <CardTitle>Pending follow requests</CardTitle>
          <AccountMiniList
            items={latest.pendingRequests.slice(0, 8).map((r) => ({ username: r.username, date: r.timestamp }))}
            empty="No pending requests."
          />
        </Card>
        <Card>
          <CardTitle>Recently unfollowed (from Instagram)</CardTitle>
          <AccountMiniList
            items={latest.recentlyUnfollowed.slice(0, 8).map((r) => ({ username: r.username, date: r.timestamp }))}
            empty="No recently unfollowed accounts in this export."
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Your tags</CardTitle>
          {tags.length === 0 ? (
            <p className="text-sm text-muted">
              Tag accounts on the <Link href="/following" className="text-white underline">Following</Link> page (for example
              friend, brand, creator) to see a breakdown here.
            </p>
          ) : (
            <ul className="space-y-3">
              {tags.map((t) => (
                <li key={t.tag}>
                  <div className="mb-1 flex justify-between text-sm">
                    <Link href={`/following?tab=tagged&tag=${encodeURIComponent(t.tag)}`} className="text-white hover:underline">
                      {t.tag}
                    </Link>
                    <span className="text-muted">
                      {t.total} ({t.mutual} mutual)
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="bg-[#515bd4]" style={{ width: `${(t.mutual / t.total) * 100}%` }} />
                    <div className="bg-[#dd2a7b]" style={{ width: `${(t.notFollowingBack / t.total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Changes since your previous import</CardTitle>
          {diff && previous ? (
            <div className="space-y-4">
              <p className="text-xs text-muted">Compared with the import from {formatDate(previous.importedAt)}</p>
              <DiffList title="New followers" names={diff.newFollowers} tone="text-emerald-300" />
              <DiffList title="Stopped following you" names={diff.lostFollowers} tone="text-rose-300" />
              <DiffList title="You started following" names={diff.newFollowing} tone="text-sky-300" />
              <DiffList title="You unfollowed" names={diff.youUnfollowed} tone="text-amber-300" />
            </div>
          ) : (
            <p className="text-sm text-muted">
              Import a newer export later to see who followed you, who stopped following you, and who you unfollowed in
              between.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
