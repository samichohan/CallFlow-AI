// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDuration, intervalToDuration } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds into human-readable duration e.g. "4m 5s" */
export function formatCallDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds === 0) return "—";
  const dur = intervalToDuration({ start: 0, end: seconds * 1000 });
  if (dur.hours) return `${dur.hours}h ${dur.minutes}m ${dur.seconds}s`;
  if (dur.minutes) return `${dur.minutes}m ${dur.seconds}s`;
  return `${dur.seconds}s`;
}

/** Map a status string to a Tailwind badge colour class */
export function statusColor(status: string): string {
  const map: Record<string, string> = {
    // calls
    ended:        "bg-green-500/15 text-green-400 border-green-500/30",
    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    missed:       "bg-red-500/15 text-red-400 border-red-500/30",
    failed:       "bg-red-500/15 text-red-400 border-red-500/30",
    initiated:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    // tickets
    open:         "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    resolved:     "bg-green-500/15 text-green-400 border-green-500/30",
    closed:       "bg-gray-500/15 text-gray-400 border-gray-500/30",
    // customers
    active:       "bg-green-500/15 text-green-400 border-green-500/30",
    inactive:     "bg-gray-500/15 text-gray-400 border-gray-500/30",
    vip:          "bg-purple-500/15 text-purple-400 border-purple-500/30",
    // priority
    low:          "bg-gray-500/15 text-gray-400 border-gray-500/30",
    medium:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
    high:         "bg-orange-500/15 text-orange-400 border-orange-500/30",
    urgent:       "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return map[status?.toLowerCase()] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

/** Truncate a long string */
export function truncate(str: string | null | undefined, len = 60): string {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

