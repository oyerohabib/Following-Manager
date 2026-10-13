import Dexie, { type EntityTable } from "dexie";
import type { Action, ActionStatus, Annotation, Snapshot } from "./types";

export interface Setting {
  key: string;
  value: unknown;
}

export const DEFAULT_DAILY_LIMIT = 50;

export const db = new Dexie("ig-following-manager") as Dexie & {
  snapshots: EntityTable<Snapshot, "id">;
  accounts: EntityTable<Annotation, "username">;
  actions: EntityTable<Action, "username">;
  settings: EntityTable<Setting, "key">;
};

db.version(1).stores({
  snapshots: "++id, importedAt",
  accounts: "&username, keep, *tags",
  actions: "&username, status, queuedAt, updatedAt",
  settings: "&key",
});

export async function saveSnapshot(snapshot: Omit<Snapshot, "id">): Promise<number> {
  return (await db.snapshots.add(snapshot)) as number;
}

async function updateAnnotation(username: string, change: (a: Annotation) => Annotation) {
  const current = (await db.accounts.get(username)) ?? { username, tags: [], keep: false };
  await db.accounts.put(change(current));
}

export async function setKeep(usernames: string[], keep: boolean) {
  await db.transaction("rw", db.accounts, db.actions, async () => {
    for (const username of usernames) {
      await updateAnnotation(username, (a) => ({ ...a, keep }));
      if (keep) {
        const action = await db.actions.get(username);
        if (action?.status === "queued") await setStatus(username, "kept");
      }
    }
  });
}

export async function addTag(usernames: string[], tag: string) {
  const clean = tag.trim().toLowerCase();
  if (!clean) return;
  await db.transaction("rw", db.accounts, async () => {
    for (const username of usernames) {
      await updateAnnotation(username, (a) => ({
        ...a,
        tags: a.tags.includes(clean) ? a.tags : [...a.tags, clean],
      }));
    }
  });
}

export async function removeTag(usernames: string[], tag: string) {
  await db.transaction("rw", db.accounts, async () => {
    for (const username of usernames) {
      await updateAnnotation(username, (a) => ({ ...a, tags: a.tags.filter((t) => t !== tag) }));
    }
  });
}

export async function enqueue(usernames: string[]) {
  const now = Date.now();
  await db.actions.bulkPut(
    usernames.map((username, i) => ({ username, status: "queued", queuedAt: now + i, updatedAt: now })),
  );
}

export async function dequeue(usernames: string[]) {
  await db.actions.bulkDelete(usernames);
}

export async function setStatus(username: string, status: ActionStatus) {
  const now = Date.now();
  const existing = await db.actions.get(username);
  await db.actions.put({ username, status, queuedAt: existing?.queuedAt ?? now, updatedAt: now });
}

export async function restoreAction(previous: Action) {
  await db.actions.put(previous);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return ((await db.settings.get(key))?.value as T | undefined) ?? fallback;
}

export async function putSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

export async function clearAll() {
  await Promise.all([db.snapshots.clear(), db.accounts.clear(), db.actions.clear(), db.settings.clear()]);
}
