import type { ExportFile } from "@/lib/parser";

const ts = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

/** Older export layout: username in `value`, followers as a bare array. */
export const oldFormat: ExportFile[] = [
  {
    path: "instagram-me-2023/followers_and_following/followers_1.json",
    text: JSON.stringify([
      { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/alice", value: "alice", timestamp: ts("2022-01-10") }] },
      { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/carol", value: "carol", timestamp: ts("2022-03-02") }] },
    ]),
  },
  {
    path: "instagram-me-2023/followers_and_following/following.json",
    text: JSON.stringify({
      relationships_following: [
        { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/alice", value: "alice", timestamp: ts("2021-12-01") }] },
        { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/bob", value: "bob", timestamp: ts("2023-05-20") }] },
      ],
    }),
  },
];

/** Newer export layout: username in `title`, href uses `/_u/`, nested connections folder. */
export const newFormat: ExportFile[] = [
  {
    path: "connections/followers_and_following/followers_1.json",
    text: JSON.stringify([
      { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/Alice", value: "Alice", timestamp: ts("2024-01-01") }] },
    ]),
  },
  {
    path: "connections/followers_and_following/followers_2.json",
    text: JSON.stringify([
      { title: "", media_list_data: [], string_list_data: [{ href: "https://www.instagram.com/dave", value: "dave", timestamp: ts("2024-02-01") }] },
    ]),
  },
  {
    path: "connections/followers_and_following/following.json",
    text: JSON.stringify({
      relationships_following: [
        { title: "alice", string_list_data: [{ href: "https://www.instagram.com/_u/alice", timestamp: ts("2023-11-11") }] },
        { title: "", string_list_data: [{ href: "https://www.instagram.com/_u/eve", timestamp: ts("2024-03-03") }] },
      ],
    }),
  },
  {
    path: "connections/followers_and_following/close_friends.json",
    text: JSON.stringify({
      relationships_close_friends: [{ title: "", string_list_data: [{ href: "https://www.instagram.com/alice", value: "alice", timestamp: ts("2024-01-05") }] }],
    }),
  },
  {
    path: "connections/followers_and_following/pending_follow_requests.json",
    text: JSON.stringify({
      relationships_follow_requests_sent: [{ title: "", string_list_data: [{ href: "https://www.instagram.com/frank", value: "frank", timestamp: ts("2024-04-04") }] }],
    }),
  },
  {
    path: "connections/followers_and_following/recently_unfollowed_profiles.json",
    text: JSON.stringify({
      relationships_unfollowed_users: [{ title: "", string_list_data: [{ href: "https://www.instagram.com/gina", value: "gina", timestamp: ts("2024-04-10") }] }],
    }),
  },
  { path: "connections/followers_and_following/following_hashtags.json", text: "{}" },
];
