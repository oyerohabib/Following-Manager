"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { z } from "zod";
import { Button, Card, CardTitle } from "@/components/ui";
import { clearAll, db, DEFAULT_DAILY_LIMIT } from "@/lib/db";
import { downloadJson, formatDate, formatNumber } from "@/lib/format";
import { useSetting } from "@/lib/hooks";

const backupSchema = z.object({
  version: z.literal(1),
  accounts: z.array(z.object({ username: z.string(), tags: z.array(z.string()), keep: z.boolean() })),
  actions: z.array(
    z.object({
      username: z.string(),
      status: z.enum(["queued", "unfollowed", "kept", "skipped"]),
      queuedAt: z.number(),
      updatedAt: z.number(),
    }),
  ),
});

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useSetting("dailyLimit", DEFAULT_DAILY_LIMIT);
  const snapshots = useLiveQuery(() => db.snapshots.orderBy("importedAt").reverse().toArray(), []);
  const [message, setMessage] = useState<string | null>(null);

  async function exportBackup() {
    const [accounts, actions] = await Promise.all([db.accounts.toArray(), db.actions.toArray()]);
    downloadJson(`following-manager-tags-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      exportedAt: Date.now(),
      accounts,
      actions,
    });
  }

  async function importBackup(file: File) {
    try {
      const backup = backupSchema.parse(JSON.parse(await file.text()));
      await db.transaction("rw", db.accounts, db.actions, async () => {
        await db.accounts.bulkPut(backup.accounts);
        await db.actions.bulkPut(backup.actions);
      });
      setMessage(`Restored ${backup.accounts.length} tagged or kept accounts and ${backup.actions.length} queue entries.`);
    } catch {
      setMessage("That file is not a valid backup from this app.");
    }
  }

  async function wipe() {
    if (!window.confirm("Delete all imports, tags, keep list and queue from this browser?")) return;
    await clearAll();
    setMessage("All data cleared.");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {message && <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white">{message}</p>}

      <Card>
        <CardTitle>Daily unfollow pace</CardTitle>
        <p className="mb-3 text-sm text-muted">
          Instagram does not publish its limits, and too many unfollows in a short time can lead to a temporary action
          block. The queue warns you when you reach this number in a day.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={500}
            value={dailyLimit}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n > 0) setDailyLimit(Math.min(n, 500));
            }}
            className="w-24 rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10"
          />
          <span className="text-sm text-muted">unfollows per day (default {DEFAULT_DAILY_LIMIT})</span>
        </div>
      </Card>

      <Card>
        <CardTitle>Back up tags, keep list and queue</CardTitle>
        <p className="mb-3 text-sm text-muted">
          Your Instagram export can always be imported again, but tags and decisions only live in this browser. Save
          them to a file to move them to another browser or keep them safe.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportBackup}>Download backup</Button>
          <label className="inline-flex cursor-pointer items-center rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/14">
            Restore from file
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importBackup(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardTitle>Imports</CardTitle>
        {!snapshots?.length ? (
          <p className="text-sm text-muted">No imports yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {snapshots.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <span className="text-white">{s.sourceName}</span>
                  {i === 0 && <span className="ml-2 text-xs text-fuchsia-300">current</span>}
                  <div className="text-xs text-muted">
                    {formatDate(s.importedAt)}: {formatNumber(s.following.length)} following,{" "}
                    {formatNumber(s.followers.length)} followers
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => s.id && db.snapshots.delete(s.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Danger zone</CardTitle>
        <p className="mb-3 text-sm text-muted">Removes everything this app has stored in this browser.</p>
        <Button variant="danger" onClick={wipe}>
          Clear all data
        </Button>
      </Card>
    </div>
  );
}
