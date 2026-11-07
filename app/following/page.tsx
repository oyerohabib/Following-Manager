"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AccountTable } from "@/components/AccountTable";
import { TagPicker } from "@/components/TagPicker";
import { Button, cx, NoDataYet } from "@/components/ui";
import { addTag, dequeue, enqueue, setGone, setKeep } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { useAppData } from "@/lib/hooks";
import { type ExplorerTab, filterRows, type SortKey, TAB_PREDICATES } from "@/lib/metrics";

const TABS: { id: ExplorerTab; label: string }[] = [
  { id: "following", label: "All following" },
  { id: "mutual", label: "Mutual" },
  { id: "notFollowingBack", label: "Not following back" },
  { id: "fans", label: "Fans" },
  { id: "kept", label: "Kept" },
  { id: "tagged", label: "Tagged" },
  { id: "unfollowed", label: "Unfollowed" },
  { id: "gone", label: "Gone" },
];

function Explorer() {
  const { loading, latest, rows, allTags } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "following") as ExplorerTab;
  const tag = params.get("tag") ?? "";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("oldest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const setParams = (next: Record<string, string>) => {
    const search = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) search.set(k, v);
      else search.delete(k);
    }
    setSelected(new Set());
    router.replace(`${pathname}?${search}`, { scroll: false });
  };

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, rows.filter(TAB_PREDICATES[t.id]).length])),
    [rows],
  );
  const visible = useMemo(() => filterRows(rows, { tab, query, tag, sort }), [rows, tab, query, tag, sort]);

  if (loading) return null;
  if (!latest) return <NoDataYet />;

  const selectedRows = rows.filter((r) => selected.has(r.username));
  const queueable = selectedRows.filter((r) => r.iFollow && !r.keep && r.status !== "queued").map((r) => r.username);
  const selectedNames = [...selected];

  const toggle = (username: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Following</h1>
          <p className="text-sm text-muted">
            Select accounts to tag them, keep them, mark them gone, or add them to your unfollow queue. Gone accounts
            (deleted or unavailable) are excluded from Following counts.
          </p>
        </div>
        <Link href="/queue" className="rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/14">
          Open unfollow queue
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ tab: t.id, tag: "" })}
            className={cx(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
              tab === t.id ? "bg-white/12 text-white" : "text-muted hover:text-white",
            )}
          >
            {t.label}
            <span className="text-xs text-muted">{formatNumber(counts[t.id] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username or tag"
          className="min-w-56 flex-1 rounded-xl bg-surface px-4 py-2 text-sm text-white outline-none ring-1 ring-white/8 placeholder:text-muted focus:ring-fuchsia-500/50"
        />
        {(tab === "tagged" || tag) && (
          <select
            value={tag}
            onChange={(e) => setParams({ tag: e.target.value })}
            className="rounded-xl bg-surface px-3 py-2 text-sm text-white ring-1 ring-white/8"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl bg-surface px-3 py-2 text-sm text-white ring-1 ring-white/8"
        >
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
          <option value="az">Username A-Z</option>
          <option value="za">Username Z-A</option>
        </select>
        <Button
          variant="ghost"
          onClick={() =>
            setSelected(selected.size === visible.length ? new Set() : new Set(visible.map((r) => r.username)))
          }
        >
          {selected.size === visible.length && visible.length > 0 ? "Clear selection" : `Select all ${formatNumber(visible.length)}`}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-[#1d1d26] px-4 py-2.5 shadow-xl">
          <span className="mr-2 text-sm font-semibold text-white">{formatNumber(selected.size)} selected</span>
          <Button size="sm" variant="primary" disabled={queueable.length === 0} onClick={() => enqueue(queueable)}>
            Add {queueable.length} to queue
          </Button>
          <Button size="sm" onClick={() => dequeue(selectedNames)}>
            Remove from queue
          </Button>
          <Button size="sm" onClick={() => setKeep(selectedNames, true)}>
            Keep
          </Button>
          <Button size="sm" onClick={() => setKeep(selectedNames, false)}>
            Unkeep
          </Button>
          <Button size="sm" onClick={() => setGone(selectedNames, true)}>
            Mark gone
          </Button>
          <Button size="sm" onClick={() => setGone(selectedNames, false)}>
            Ungone
          </Button>
          <TagPicker allTags={allTags} onSelect={(t) => addTag(selectedNames, t)} />
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <AccountTable rows={visible} selected={selected} onToggle={toggle} allTags={allTags} />
    </div>
  );
}

export default function FollowingPage() {
  return (
    <Suspense>
      <Explorer />
    </Suspense>
  );
}
