const dateFormat = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });

export function formatDate(ms?: number): string {
  return ms ? dateFormat.format(ms) : "Unknown";
}

export function formatAge(ms?: number, now = Date.now()): string {
  if (!ms) return "";
  const days = Math.floor((now - ms) / 86_400_000);
  if (days < 1) return "today";
  if (days < 31) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = days / 365;
  return `${years < 10 ? years.toFixed(1).replace(/\.0$/, "") : Math.floor(years)}y`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function profileUrl(username: string): string {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
