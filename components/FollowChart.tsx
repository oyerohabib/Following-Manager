"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { timeline } from "@/lib/metrics";
import type { AccountRow } from "@/lib/types";
import { Card, CardTitle, cx } from "./ui";

export function FollowChart({ rows }: { rows: AccountRow[] }) {
  const [granularity, setGranularity] = useState<"month" | "year">("year");
  const data = useMemo(() => timeline(rows, granularity), [rows, granularity]);

  return (
    <Card>
      <CardTitle
        action={
          <div className="flex rounded-lg bg-white/5 p-0.5 text-xs">
            {(["year", "month"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cx("rounded-md px-2.5 py-1 capitalize", granularity === g ? "bg-white/12 text-white" : "text-muted")}
              >
                By {g}
              </button>
            ))}
          </div>
        }
      >
        Follows over time
      </CardTitle>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">The export has no follow dates.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "#a1a1b0", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis tick={{ fill: "#a1a1b0", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "#1d1d26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="youFollowed" name="You followed" fill="#dd2a7b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="followedYou" name="Followed you" fill="#515bd4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
