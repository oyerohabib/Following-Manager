export interface ExportRecord {
  username: string;
  href: string;
  /** Milliseconds since epoch, when Instagram recorded the relationship. */
  timestamp?: number;
}

export interface ParsedExport {
  following: ExportRecord[];
  followers: ExportRecord[];
  closeFriends: ExportRecord[];
  pendingRequests: ExportRecord[];
  recentlyUnfollowed: ExportRecord[];
  blocked: ExportRecord[];
  restricted: ExportRecord[];
  filesFound: string[];
  warnings: string[];
}

export interface Snapshot extends Omit<ParsedExport, "warnings"> {
  id?: number;
  importedAt: number;
  sourceName: string;
}

export interface Annotation {
  username: string;
  tags: string[];
  keep: boolean;
}

export type ActionStatus = "queued" | "unfollowed" | "kept" | "skipped";

export interface Action {
  username: string;
  status: ActionStatus;
  queuedAt: number;
  updatedAt: number;
}

export interface AccountRow {
  username: string;
  href: string;
  iFollow: boolean;
  followsMe: boolean;
  followedAt?: number;
  followsMeSince?: number;
  closeFriend: boolean;
  /** Marked as unfollowed in the app after this snapshot was imported. */
  unfollowedHere: boolean;
  tags: string[];
  keep: boolean;
  status?: ActionStatus;
}
