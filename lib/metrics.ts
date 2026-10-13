import type { AccountRow, Action, Annotation, Snapshot } from "./types";

export function buildAccounts(
  snapshot: Snapshot,
  annotations: Annotation[],
  actions: Action[],
): AccountRow[] {
  const notes = new Map(annotations.map((a) => [a.username, a]));
  const acts = new Map(actions.map((a) => [a.username, a]));
  const followers = new Map(snapshot.followers.map((r) => [r.username, r]));
  const closeFriends = new Set(snapshot.closeFriends.map((r) => r.username));
  const rows = new Map<string, AccountRow>();

  const base = (username: string, href: string): AccountRow => {
    const note = notes.get(username);
    const action = acts.get(username);
    return {
      username,
      href,
      iFollow: false,
      followsMe: followers.has(username),
      followsMeSince: followers.get(username)?.timestamp,
      closeFriend: closeFriends.has(username),
      unfollowedHere: false,
      tags: note?.tags ?? [],
      keep: note?.keep ?? false,
      status: action?.status,
    };
  };

  for (const record of snapshot.following) {
    const row = base(record.username, record.href);
    const action = acts.get(record.username);
    row.unfollowedHere = action?.status === "unfollowed" && action.updatedAt > snapshot.importedAt;
    row.iFollow = !row.unfollowedHere;
    row.followedAt = record.timestamp;
    rows.set(record.username, row);
  }
  for (const record of snapshot.followers) {
    if (!rows.has(record.username)) rows.set(record.username, base(record.username, record.href));
  }
  return [...rows.values()];
}

export interface Stats {
  following: number;
  followers: number;
  mutuals: number;
  notFollowingBack: number;
  fans: number;
  followBackRatio: number;
  followerToFollowingRatio: number;
  closeFriends: number;
  closeFriendsFollowingBack: number;
  pendingRequests: number;
  recentlyUnfollowed: number;
  unfollowedHere: number;
  kept: number;
  queued: number;
  busiestMonth?: { period: string; count: number };
}

export function computeStats(rows: AccountRow[], snapshot: Snapshot): Stats {
  const following = rows.filter((r) => r.iFollow);
  const mutuals = following.filter((r) => r.followsMe).length;
  const followers = rows.filter((r) => r.followsMe).length;
  const closeFriendRows = rows.filter((r) => r.closeFriend);
  const months = timeline(rows, "month");
  const busiest = months.reduce<Stats["busiestMonth"]>(
    (best, m) => (m.youFollowed > (best?.count ?? 0) ? { period: m.period, count: m.youFollowed } : best),
    undefined,
  );
  return {
    following: following.length,
    followers,
    mutuals,
    notFollowingBack: following.length - mutuals,
    fans: rows.filter((r) => r.followsMe && !r.iFollow).length,
    followBackRatio: following.length ? mutuals / following.length : 0,
    followerToFollowingRatio: following.length ? followers / following.length : 0,
    closeFriends: closeFriendRows.length,
    closeFriendsFollowingBack: closeFriendRows.filter((r) => r.followsMe).length,
    pendingRequests: snapshot.pendingRequests.length,
    recentlyUnfollowed: snapshot.recentlyUnfollowed.length,
    unfollowedHere: rows.filter((r) => r.unfollowedHere).length,
    kept: rows.filter((r) => r.keep && r.iFollow).length,
    queued: rows.filter((r) => r.status === "queued" && r.iFollow).length,
    busiestMonth: busiest,
  };
}

export interface TimelinePoint {
  period: string;
  youFollowed: number;
  followedYou: number;
}

function periodKey(ms: number, granularity: "month" | "year"): string {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  return granularity === "year" ? `${year}` : `${year}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextPeriod(key: string, granularity: "month" | "year"): string {
  if (granularity === "year") return `${Number(key) + 1}`;
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function timeline(rows: AccountRow[], granularity: "month" | "year"): TimelinePoint[] {
  const buckets = new Map<string, TimelinePoint>();
  const bump = (ms: number | undefined, field: "youFollowed" | "followedYou") => {
    if (!ms) return;
    const period = periodKey(ms, granularity);
    const point = buckets.get(period) ?? { period, youFollowed: 0, followedYou: 0 };
    point[field] += 1;
    buckets.set(period, point);
  };
  for (const row of rows) {
    bump(row.followedAt, "youFollowed");
    bump(row.followsMeSince, "followedYou");
  }
  const keys = [...buckets.keys()].sort();
  if (keys.length === 0) return [];
  const filled: TimelinePoint[] = [];
  for (let key = keys[0]; key <= keys[keys.length - 1]; key = nextPeriod(key, granularity)) {
    filled.push(buckets.get(key) ?? { period: key, youFollowed: 0, followedYou: 0 });
  }
  return filled;
}

export function oldestNonReciprocal(rows: AccountRow[], limit = 10): AccountRow[] {
  return rows
    .filter((r) => r.iFollow && !r.followsMe && !r.keep && r.followedAt)
    .sort((a, b) => a.followedAt! - b.followedAt!)
    .slice(0, limit);
}

export function recentFollows(rows: AccountRow[], limit = 10): AccountRow[] {
  return rows
    .filter((r) => r.iFollow && r.followedAt)
    .sort((a, b) => b.followedAt! - a.followedAt!)
    .slice(0, limit);
}

export interface TagStat {
  tag: string;
  total: number;
  mutual: number;
  notFollowingBack: number;
}

export function tagBreakdown(rows: AccountRow[]): TagStat[] {
  const stats = new Map<string, TagStat>();
  for (const row of rows) {
    if (!row.iFollow) continue;
    for (const tag of row.tags) {
      const s = stats.get(tag) ?? { tag, total: 0, mutual: 0, notFollowingBack: 0 };
      s.total += 1;
      if (row.followsMe) s.mutual += 1;
      else s.notFollowingBack += 1;
      stats.set(tag, s);
    }
  }
  return [...stats.values()].sort((a, b) => b.total - a.total);
}

export interface SnapshotDiff {
  newFollowers: string[];
  lostFollowers: string[];
  newFollowing: string[];
  youUnfollowed: string[];
}

export function diffSnapshots(previous: Snapshot, latest: Snapshot): SnapshotDiff {
  const names = (list: { username: string }[]) => new Set(list.map((r) => r.username));
  const minus = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x)).sort();
  const prevFollowers = names(previous.followers);
  const nextFollowers = names(latest.followers);
  const prevFollowing = names(previous.following);
  const nextFollowing = names(latest.following);
  return {
    newFollowers: minus(nextFollowers, prevFollowers),
    lostFollowers: minus(prevFollowers, nextFollowers),
    newFollowing: minus(nextFollowing, prevFollowing),
    youUnfollowed: minus(prevFollowing, nextFollowing),
  };
}

export type ExplorerTab =
  | "following"
  | "mutual"
  | "notFollowingBack"
  | "fans"
  | "kept"
  | "tagged"
  | "unfollowed";

export type SortKey = "newest" | "oldest" | "az" | "za";

export const TAB_PREDICATES: Record<ExplorerTab, (r: AccountRow) => boolean> = {
  following: (r) => r.iFollow,
  mutual: (r) => r.iFollow && r.followsMe,
  notFollowingBack: (r) => r.iFollow && !r.followsMe,
  fans: (r) => r.followsMe && !r.iFollow,
  kept: (r) => r.iFollow && r.keep,
  tagged: (r) => r.tags.length > 0,
  unfollowed: (r) => r.unfollowedHere,
};

export function filterRows(
  rows: AccountRow[],
  opts: { tab: ExplorerTab; query?: string; tag?: string; sort: SortKey },
): AccountRow[] {
  const query = opts.query?.trim().toLowerCase().replace(/^@/, "");
  const result = rows.filter(
    (r) =>
      TAB_PREDICATES[opts.tab](r) &&
      (!query || r.username.includes(query) || r.tags.some((t) => t.includes(query))) &&
      (!opts.tag || r.tags.includes(opts.tag)),
  );
  const time = (r: AccountRow) => r.followedAt ?? r.followsMeSince ?? 0;
  const sorters: Record<SortKey, (a: AccountRow, b: AccountRow) => number> = {
    newest: (a, b) => time(b) - time(a),
    oldest: (a, b) => time(a) - time(b),
    az: (a, b) => a.username.localeCompare(b.username),
    za: (a, b) => b.username.localeCompare(a.username),
  };
  return result.sort(sorters[opts.sort]);
}

export function startOfToday(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function unfollowedToday(actions: Action[], now = Date.now()): number {
  const start = startOfToday(now);
  return actions.filter((a) => a.status === "unfollowed" && a.updatedAt >= start).length;
}
