import type { RouteOptionDto } from "./types";

export type TimeAnchor = "start" | "end";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string) {
  return TIME_PATTERN.test(value);
}

function timeToMinutes(value: string) {
  if (!isValidTime(value)) return null;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function calculateLinkedTime(value: string, durationMinutes: number, anchor: TimeAnchor) {
  const minutes = timeToMinutes(value);
  if (minutes === null || durationMinutes <= 0) return "";
  const linkedMinutes = anchor === "start" ? minutes + durationMinutes : minutes - durationMinutes;
  if (linkedMinutes < 0 || linkedMinutes >= 24 * 60) return "";
  return minutesToTime(linkedMinutes);
}

export function filterRouteOptions(options: RouteOptionDto[], value: string) {
  const query = value.trim().toLocaleLowerCase("de-DE");
  const hasExactSelection = options.some((option) => option.label === value);
  if (!query || hasExactSelection) return options;
  return options.filter((option) => option.label.toLocaleLowerCase("de-DE").startsWith(query));
}
