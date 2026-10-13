import { describe, expect, it } from "vitest";
import {
  buildAccounts,
  computeStats,
  diffSnapshots,
  filterRows,
  oldestNonReciprocal,
  tagBreakdown,
  timeline,
  unfollowedToday,
} from "@/lib/metrics";
import { parseExportFiles } from "@/lib/parser";
import type { Snapshot } from "@/lib/types";
import { newFormat, oldFormat } from "./fixtures";

const toSnapshot = (files: typeof oldFormat, importedAt: number): Snapshot => {
  const { warnings: _warnings, ...parsed } = parseExportFiles(files);
  return { ...parsed, importedAt, sourceName: "test" };
};

const oldSnap = toSnapshot(oldFormat, 1000);
const newSnap = toSnapshot(newFormat, 2000);

describe("buildAccounts and computeStats", () => {
  it("derives relationships", () => {
    const rows = buildAccounts(oldSnap, [], []);
    const byName = Object.fromEntries(rows.map((r) => [r.username, r]));
    expect(byName.alice).toMatchObject({ iFollow: true, followsMe: true });
    expect(byName.bob).toMatchObject({ iFollow: true, followsMe: false });
    expect(byName.carol).toMatchObject({ iFollow: false, followsMe: true });

    const stats = computeStats(rows, oldSnap);
    expect(stats).toMatchObject({ following: 2, followers: 2, mutuals: 1, notFollowingBack: 1, fans: 1 });
    expect(stats.followBackRatio).toBe(0.5);
  });

  it("treats accounts unfollowed in the app after import as no longer followed", () => {
    const rows = buildAccounts(
      oldSnap,
      [{ username: "alice", tags: ["friend"], keep: false }],
      [{ username: "alice", status: "unfollowed", queuedAt: 1500, updatedAt: 1500 }],
    );
    const alice = rows.find((r) => r.username === "alice")!;
    expect(alice).toMatchObject({ iFollow: false, unfollowedHere: true, tags: ["friend"] });
    expect(computeStats(rows, oldSnap)).toMatchObject({ following: 1, fans: 2, unfollowedHere: 1 });
  });

  it("counts close friends and pending requests", () => {
    const stats = computeStats(buildAccounts(newSnap, [], []), newSnap);
    expect(stats).toMatchObject({ closeFriends: 1, closeFriendsFollowingBack: 1, pendingRequests: 1 });
  });
});

describe("timeline", () => {
  it("fills missing months between first and last activity", () => {
    const points = timeline(buildAccounts(oldSnap, [], []), "month");
    expect(points[0].period).toBe("2021-12");
    expect(points.at(-1)!.period).toBe("2023-05");
    expect(points).toHaveLength(18);
    expect(points.reduce((n, p) => n + p.youFollowed, 0)).toBe(2);
  });

  it("groups by year", () => {
    const points = timeline(buildAccounts(oldSnap, [], []), "year");
    expect(points.map((p) => p.period)).toEqual(["2021", "2022", "2023"]);
  });
});

describe("lists and filters", () => {
  const rows = buildAccounts(
    oldSnap,
    [{ username: "bob", tags: ["brand"], keep: false }],
    [],
  );

  it("finds the oldest follows that do not follow back", () => {
    expect(oldestNonReciprocal(rows).map((r) => r.username)).toEqual(["bob"]);
  });

  it("builds tag breakdowns", () => {
    expect(tagBreakdown(rows)).toEqual([{ tag: "brand", total: 1, mutual: 0, notFollowingBack: 1 }]);
  });

  it("filters by tab, query and sort", () => {
    expect(filterRows(rows, { tab: "following", sort: "az" }).map((r) => r.username)).toEqual(["alice", "bob"]);
    expect(filterRows(rows, { tab: "following", sort: "newest" }).map((r) => r.username)).toEqual(["bob", "alice"]);
    expect(filterRows(rows, { tab: "fans", sort: "az" }).map((r) => r.username)).toEqual(["carol"]);
    expect(filterRows(rows, { tab: "following", query: "@ALI", sort: "az" }).map((r) => r.username)).toEqual(["alice"]);
    expect(filterRows(rows, { tab: "following", query: "zzz", sort: "az" })).toHaveLength(0);
    expect(filterRows(rows, { tab: "following", query: "bran", sort: "az" }).map((r) => r.username)).toEqual(["bob"]);
  });
});

describe("diffSnapshots", () => {
  it("compares two imports", () => {
    expect(diffSnapshots(oldSnap, newSnap)).toEqual({
      newFollowers: ["dave"],
      lostFollowers: ["carol"],
      newFollowing: ["eve"],
      youUnfollowed: ["bob"],
    });
  });
});

describe("unfollowedToday", () => {
  it("only counts unfollows since local midnight", () => {
    const now = new Date(2026, 5, 1, 15).getTime();
    const actions = [
      { username: "a", status: "unfollowed" as const, queuedAt: 0, updatedAt: now - 60_000 },
      { username: "b", status: "unfollowed" as const, queuedAt: 0, updatedAt: now - 86_400_000 },
      { username: "c", status: "kept" as const, queuedAt: 0, updatedAt: now },
    ];
    expect(unfollowedToday(actions, now)).toBe(1);
  });
});
