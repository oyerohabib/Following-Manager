"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";
import { db, getSetting, putSetting } from "./db";
import { buildAccounts } from "./metrics";

export function useAppData() {
  const snapshots = useLiveQuery(() => db.snapshots.orderBy("importedAt").reverse().limit(2).toArray(), []);
  const annotations = useLiveQuery(() => db.accounts.toArray(), []);
  const actions = useLiveQuery(() => db.actions.toArray(), []);

  const latest = snapshots?.[0];
  const previous = snapshots?.[1];
  const rows = useMemo(
    () => (latest && annotations && actions ? buildAccounts(latest, annotations, actions) : []),
    [latest, annotations, actions],
  );

  return {
    loading: !snapshots || !annotations || !actions,
    latest,
    previous,
    rows,
    actions: actions ?? [],
    allTags: useMemo(
      () => [...new Set((annotations ?? []).flatMap((a) => a.tags))].sort(),
      [annotations],
    ),
  };
}

export function useSetting<T>(key: string, fallback: T): [T, (value: T) => Promise<void>] {
  const value = useLiveQuery(() => getSetting(key, fallback), [key]) ?? fallback;
  const set = useCallback((next: T) => putSetting(key, next), [key]);
  return [value, set];
}
