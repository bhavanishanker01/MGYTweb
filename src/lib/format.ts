export const currency = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return `₹${(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const dt = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export const timeLeft = (v: string | Date) => {
  const target = new Date(v).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return "Live now";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hrs = Math.floor((mins - days * 60 * 24) / 60);
  const m = mins - days * 60 * 24 - hrs * 60;
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${m}m`;
  return `${m}m`;
};

export const tournamentTypeLabel: Record<string, string> = {
  br_solo: "BR Solo",
  br_duo: "BR Duo",
  br_squad: "BR Squad",
  cs_squad: "CS Squad",
};
