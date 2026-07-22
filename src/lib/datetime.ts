import type { Timestamp } from "firebase/firestore";
import {
  format,
  isThisYear,
  isToday,
  isYesterday,
  formatDistanceToNowStrict,
} from "date-fns";

export function toDate(value: Timestamp | null | undefined): Date | null {
  if (!value) return null;
  try {
    return value.toDate();
  } catch {
    return null;
  }
}

/** Short time for message bubbles, e.g. "14:05". */
export function formatMessageTime(value: Timestamp | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return format(date, "HH:mm");
}

/** Relative time for conversation list, e.g. "14:05", "Yesterday", "12 Mar". */
export function formatConversationTime(
  value: Timestamp | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "";
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "d MMM");
  return format(date, "dd/MM/yy");
}

/** Full date for message-day separators. */
export function formatDaySeparator(value: Timestamp | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "EEEE, d MMMM");
  return format(date, "d MMMM yyyy");
}

/** Human last-seen, e.g. "last seen 5 minutes ago". */
export function formatLastSeen(lastChanged: number | null | undefined): string {
  if (!lastChanged) return "offline";
  try {
    return `last seen ${formatDistanceToNowStrict(new Date(lastChanged), {
      addSuffix: true,
    })}`;
  } catch {
    return "offline";
  }
}

/** Returns true when two timestamps fall on different calendar days. */
export function isDifferentDay(
  a: Timestamp | null | undefined,
  b: Timestamp | null | undefined,
): boolean {
  const dateA = toDate(a);
  const dateB = toDate(b);
  if (!dateA || !dateB) return dateA !== dateB;
  return (
    dateA.getFullYear() !== dateB.getFullYear() ||
    dateA.getMonth() !== dateB.getMonth() ||
    dateA.getDate() !== dateB.getDate()
  );
}
