"use client";

import Link from "next/link";
import { ImportDropzone } from "@/components/ImportDropzone";
import { Card } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { useAppData } from "@/lib/hooks";

const STEPS = [
  <>
    Open{" "}
    <a
      href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
      target="_blank"
      rel="noreferrer"
      className="text-white underline underline-offset-4"
    >
      Accounts Center &gt; Your information and permissions &gt; Download your information
    </a>{" "}
    (in the app: Settings &gt; Accounts Center).
  </>,
  <>Choose <b className="text-white">Create export</b>, pick your Instagram profile, then <b className="text-white">Export to device</b>.</>,
  <>Under <b className="text-white">Customize information</b>, clear everything and select only <b className="text-white">Followers and following</b>.</>,
  <>Set the date range to <b className="text-white">All time</b> and the format to <b className="text-white">JSON</b> (not HTML).</>,
  <>Start the export. Instagram emails you when it is ready, usually within minutes to a few hours.</>,
  <>Download the .zip and drop it here. Nothing is uploaded: it is read in your browser and stored on this device.</>,
];

export default function ImportPage() {
  const { latest } = useAppData();

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          See everyone you follow, <span className="text-ig-gradient">at a glance</span>.
        </h1>
        <p className="mt-3 text-muted">
          Find out who follows you back, tidy up with a fast unfollow queue, and get stats on your following, all from
          Instagram&apos;s official data export. No password, no scraping, no bots.
        </p>
      </section>

      {latest && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Last import <span className="text-white">{formatDate(latest.importedAt)}</span> from {latest.sourceName}:{" "}
            {formatNumber(latest.following.length)} following, {formatNumber(latest.followers.length)} followers.
            Import a newer export to see what changed.
          </p>
          <Link href="/dashboard" className="rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/14">
            Open dashboard
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ImportDropzone />
        <Card>
          <h2 className="mb-4 font-semibold text-white">How to get your export</h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
