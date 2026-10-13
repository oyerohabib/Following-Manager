import type { ExportRecord, ParsedExport } from "./types";
import { emptyExport } from "./parser/parse";

const WORDS = [
  "sun", "lagos", "studio", "kitchen", "daily", "travel", "lens", "fit", "nova", "pixel", "urban",
  "golden", "vibes", "craft", "wild", "coffee", "beats", "style", "maker", "ocean", "city", "art",
  "fresh", "tech", "moon", "green", "story", "hub", "zen", "bold",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic fake export so the app can be explored before a real export arrives. */
export function generateSampleExport(): ParsedExport {
  const rand = mulberry32(42);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const now = Date.now();
  const start = now - 8 * 365 * 86_400_000;
  const record = (username: string, timestamp: number): ExportRecord => ({
    username,
    href: `https://www.instagram.com/${username}/`,
    timestamp,
  });

  const names = new Set<string>();
  while (names.size < 900) {
    const sep = pick(["", "_", ".", ""]);
    const suffix = rand() < 0.4 ? String(Math.floor(rand() * 999)) : "";
    names.add(`${pick(WORDS)}${sep}${pick(WORDS)}${suffix}`);
  }
  const all = [...names];
  const result = emptyExport();

  for (const username of all) {
    const followedAt = start + Math.pow(rand(), 0.7) * (now - start);
    const roll = rand();
    if (roll < 0.62) result.following.push(record(username, followedAt));
    if (roll < 0.38 || roll > 0.8) {
      result.followers.push(record(username, Math.min(now, followedAt + rand() * 60 * 86_400_000)));
    }
  }
  result.closeFriends = result.followers.slice(0, 12).map((r) => record(r.username, r.timestamp!));
  result.pendingRequests = all.slice(0, 4).map((u) => record(`${u}_private`, now - rand() * 90 * 86_400_000));
  result.recentlyUnfollowed = all.slice(4, 9).map((u) => record(`${u}_old`, now - rand() * 30 * 86_400_000));
  result.filesFound = ["sample/followers_1.json", "sample/following.json"];
  return result;
}
