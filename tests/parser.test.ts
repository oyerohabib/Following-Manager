import { describe, expect, it } from "vitest";
import { matchFile, parseExportFiles, usernameFromHref } from "@/lib/parser";
import { newFormat, oldFormat } from "./fixtures";

describe("parseExportFiles", () => {
  it("parses the older export format", () => {
    const result = parseExportFiles(oldFormat);
    expect(result.following.map((r) => r.username)).toEqual(["alice", "bob"]);
    expect(result.followers.map((r) => r.username)).toEqual(["alice", "carol"]);
    expect(result.following[0].timestamp).toBe(new Date("2021-12-01").getTime());
    expect(result.warnings).toEqual([]);
  });

  it("parses the newer format with titles, /_u/ links and split follower files", () => {
    const result = parseExportFiles(newFormat);
    expect(result.following.map((r) => r.username)).toEqual(["alice", "eve"]);
    expect(result.followers.map((r) => r.username)).toEqual(["alice", "dave"]);
    expect(result.closeFriends.map((r) => r.username)).toEqual(["alice"]);
    expect(result.pendingRequests.map((r) => r.username)).toEqual(["frank"]);
    expect(result.recentlyUnfollowed.map((r) => r.username)).toEqual(["gina"]);
    expect(result.following[1].href).toBe("https://www.instagram.com/eve/");
  });

  it("ignores unrelated files such as following_hashtags.json", () => {
    expect(matchFile("x/following_hashtags.json")).toBeNull();
    expect(matchFile("x/followers_12.json")).toBe("followers");
  });

  it("warns about HTML exports", () => {
    const result = parseExportFiles([{ path: "a/followers_1.html", text: "<html></html>" }]);
    expect(result.warnings[0]).toMatch(/HTML/);
  });

  it("warns about invalid JSON and a missing following file", () => {
    const result = parseExportFiles([{ path: "followers_1.json", text: "{nope" }]);
    expect(result.warnings.some((w) => w.includes("not valid JSON"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("following.json"))).toBe(true);
  });
});

describe("usernameFromHref", () => {
  it("handles plain and /_u/ links", () => {
    expect(usernameFromHref("https://www.instagram.com/_u/someone")).toBe("someone");
    expect(usernameFromHref("https://www.instagram.com/someone/")).toBe("someone");
    expect(usernameFromHref("not a url")).toBeNull();
  });
});
