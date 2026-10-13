"use client";

import { useRouter } from "next/navigation";
import { type DragEvent, useState } from "react";
import { saveSnapshot } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import {
  inputFilesFromDrop,
  inputFilesFromList,
  readExportFromFiles,
  type InputFile,
} from "@/lib/parser";
import { generateSampleExport } from "@/lib/sample";
import type { ParsedExport } from "@/lib/types";
import { Button, Card, cx } from "./ui";

const SUMMARY: { key: keyof ParsedExport; label: string }[] = [
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "closeFriends", label: "Close friends" },
  { key: "pendingRequests", label: "Pending requests" },
  { key: "recentlyUnfollowed", label: "Recently unfollowed" },
  { key: "blocked", label: "Blocked" },
  { key: "restricted", label: "Restricted" },
];

export function ImportDropzone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ parsed: ParsedExport; sourceName: string } | null>(null);

  async function handle(inputs: InputFile[], sourceName: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await readExportFromFiles(inputs);
      if (parsed.filesFound.length === 0) {
        setError(parsed.warnings[0] ?? "No followers or following files were found in what you dropped.");
      } else {
        setResult({ parsed, sourceName });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the export.");
    } finally {
      setBusy(false);
    }
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const inputs = await inputFilesFromDrop(e.dataTransfer);
    handle(inputs, inputs[0]?.path.split("/").filter(Boolean)[0] ?? "Dropped files");
  }

  async function save() {
    if (!result) return;
    const { warnings: _warnings, ...lists } = result.parsed;
    await saveSnapshot({ ...lists, importedAt: Date.now(), sourceName: result.sourceName });
    router.push("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition",
          dragging ? "border-fuchsia-400 bg-fuchsia-500/10" : "border-white/15 bg-surface",
        )}
      >
        <div className="text-4xl" aria-hidden>
          {busy ? "..." : "+"}
        </div>
        <div>
          <p className="font-semibold text-white">
            {busy ? "Reading your export..." : "Drop your Instagram export here"}
          </p>
          <p className="mt-1 text-sm text-muted">The .zip file, the unzipped folder, or the JSON files themselves</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <label className="cursor-pointer rounded-xl bg-ig-gradient px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Choose .zip or JSON
            <input
              type="file"
              accept=".zip,.json"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handle(inputFilesFromList(e.target.files), e.target.files[0]?.name)}
            />
          </label>
          <label className="cursor-pointer rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/14">
            Choose folder
            <input
              type="file"
              className="hidden"
              ref={(el) => el?.setAttribute("webkitdirectory", "")}
              onChange={(e) =>
                e.target.files &&
                handle(inputFilesFromList(e.target.files), e.target.files[0]?.webkitRelativePath.split("/")[0])
              }
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setResult({ parsed: generateSampleExport(), sourceName: "Sample data" })}
          className="text-xs text-muted underline underline-offset-4 hover:text-white"
        >
          No export yet? Try it with sample data
        </button>
      </div>

      {error && <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

      {result && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Ready to import</h2>
              <p className="text-sm text-muted">{result.sourceName}</p>
            </div>
            <Button variant="primary" onClick={save} disabled={result.parsed.following.length === 0}>
              Save and open dashboard
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SUMMARY.map(({ key, label }) => (
              <div key={key} className="rounded-xl bg-white/5 px-3 py-2">
                <div className="text-lg font-semibold text-white">
                  {formatNumber((result.parsed[key] as unknown[]).length)}
                </div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
          {result.parsed.warnings.map((w) => (
            <p key={w} className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
              {w}
            </p>
          ))}
        </Card>
      )}
    </div>
  );
}
