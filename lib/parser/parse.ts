import type { ExportRecord, ParsedExport } from "../types";
import { relationshipEntrySchema, relationshipFileSchema } from "./schema";

export interface ExportFile {
  path: string;
  text: string;
}

type ListKey = keyof Omit<ParsedExport, "filesFound" | "warnings">;

const FILE_MATCHERS: { key: ListKey; pattern: RegExp }[] = [
  { key: "followers", pattern: /^followers(_\d+)?\.json$/ },
  { key: "following", pattern: /^following(_\d+)?\.json$/ },
  { key: "closeFriends", pattern: /^close_friends\.json$/ },
  { key: "pendingRequests", pattern: /^pending_follow_requests\.json$/ },
  { key: "recentlyUnfollowed", pattern: /^recently_unfollowed_(profiles|accounts)\.json$/ },
  { key: "blocked", pattern: /^blocked_(profiles|accounts)\.json$/ },
  { key: "restricted", pattern: /^restricted_(profiles|accounts)\.json$/ },
];

export function basename(path: string): string {
  return path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
}

export function matchFile(path: string): ListKey | null {
  const name = basename(path);
  return FILE_MATCHERS.find((m) => m.pattern.test(name))?.key ?? null;
}

export function isRelevantPath(path: string): boolean {
  return matchFile(path) !== null || /^(followers|following)(_\d+)?\.html$/.test(basename(path));
}

export function usernameFromHref(href: string): string | null {
  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter((s) => s && s !== "_u");
    return segments.pop() ?? null;
  } catch {
    return null;
  }
}

function toMillis(timestamp: number | undefined): number | undefined {
  if (!timestamp || !Number.isFinite(timestamp)) return undefined;
  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function extractEntries(json: unknown): unknown[] {
  const parsed = relationshipFileSchema.safeParse(json);
  if (!parsed.success) return [];
  if (Array.isArray(parsed.data)) return parsed.data;
  const values = Object.entries(parsed.data);
  const preferred = values.find(([k, v]) => k.startsWith("relationships_") && Array.isArray(v));
  const fallback = values.find(([, v]) => Array.isArray(v));
  return ((preferred ?? fallback)?.[1] as unknown[]) ?? [];
}

export function normalizeEntry(raw: unknown): ExportRecord | null {
  const parsed = relationshipEntrySchema.safeParse(raw);
  if (!parsed.success) return null;
  const entry = parsed.data;
  const item = entry.string_list_data?.[0];
  const href = item?.href ?? "";
  const username = (item?.value || entry.title || usernameFromHref(href) || "").trim().toLowerCase();
  if (!username) return null;
  return {
    username,
    href: `https://www.instagram.com/${username}/`,
    timestamp: toMillis(item?.timestamp),
  };
}

export function parseRelationshipJson(json: unknown): ExportRecord[] {
  const seen = new Set<string>();
  const records: ExportRecord[] = [];
  for (const raw of extractEntries(json)) {
    const record = normalizeEntry(raw);
    if (record && !seen.has(record.username)) {
      seen.add(record.username);
      records.push(record);
    }
  }
  return records;
}

export function emptyExport(): ParsedExport {
  return {
    following: [],
    followers: [],
    closeFriends: [],
    pendingRequests: [],
    recentlyUnfollowed: [],
    blocked: [],
    restricted: [],
    filesFound: [],
    warnings: [],
  };
}

export function parseExportFiles(files: ExportFile[]): ParsedExport {
  const result = emptyExport();
  let sawHtml = false;

  for (const file of files) {
    const name = basename(file.path);
    if (/\.html$/.test(name)) {
      sawHtml = true;
      continue;
    }
    const key = matchFile(file.path);
    if (!key) continue;

    let json: unknown;
    try {
      json = JSON.parse(file.text);
    } catch {
      result.warnings.push(`Could not read ${name}: not valid JSON.`);
      continue;
    }
    const records = parseRelationshipJson(json);
    const existing = new Set(result[key].map((r) => r.username));
    result[key].push(...records.filter((r) => !existing.has(r.username)));
    result.filesFound.push(file.path);
  }

  if (sawHtml && result.filesFound.length === 0) {
    result.warnings.push(
      "This export is in HTML format. Request a new export and choose JSON as the format.",
    );
  } else if (!result.filesFound.some((f) => matchFile(f) === "following")) {
    result.warnings.push("No following.json found. Make sure the export includes \"Followers and following\".");
  } else if (!result.filesFound.some((f) => matchFile(f) === "followers")) {
    result.warnings.push("No followers_1.json found, so follow-back information will be missing.");
  }

  return result;
}
