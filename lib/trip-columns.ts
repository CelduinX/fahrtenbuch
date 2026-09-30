import { z } from "zod";
import type { MonthDataDto, TripDto } from "./types";
import { formatEuro } from "./money";

export const TRIP_COLUMNS = [
  { id: "sequenceNumber", label: "lfd. Nr.", headerInfo: "lfd.", headerTitle: "Nr.", width: 4 },
  { id: "date", label: "Datum", headerInfo: "", headerTitle: "Datum", width: 8 },
  { id: "startTime", label: "Beginn", headerInfo: "Uhrzeit", headerTitle: "Beginn", width: 5 },
  { id: "endTime", label: "Ende", headerInfo: "Uhrzeit", headerTitle: "Ende", width: 5 },
  { id: "routeLabel", label: "Reiseweg", headerInfo: "Reisezweck", headerTitle: "Reiseweg", width: 14 },
  { id: "odometerStart", label: "KM Beginn", headerInfo: "KM", headerTitle: "Beginn", width: 7 },
  { id: "odometerEnd", label: "KM Ende", headerInfo: "KM", headerTitle: "Ende", width: 7 },
  { id: "distanceKm", label: "Gefahrene KM", headerInfo: "KM", headerTitle: "Gefahren", width: 7 },
  { id: "accompanyingStaff", label: "Mitgenommene Bedienstete", headerInfo: "Mitgenommene", headerTitle: "Bedienstete", width: 11 },
  { id: "remark", label: "Bemerkungen", headerInfo: "", headerTitle: "Bemerkungen", width: 12 },
  { id: "reimbursedKm", label: "KM abrechenbar", headerInfo: "KM", headerTitle: "Abrechenbar", width: 7 },
  { id: "unreimbursedKm", label: "KM nicht abrechenbar", headerInfo: "KM", headerTitle: "Nicht abrechenbar", width: 11 },
  { id: "potentialReimbursementCents", label: "mögliche Erstattung", headerInfo: "mögliche", headerTitle: "Erstattung", width: 8 },
] as const;
export type TripColumnId = typeof TRIP_COLUMNS[number]["id"];
// Minimum screen widths; all visible data columns share additional space equally.
export const TRIP_SCREEN_COLUMN_WIDTHS: Record<TripColumnId, number> = {
  sequenceNumber: 56, date: 96, startTime: 64, endTime: 64,
  routeLabel: 140, odometerStart: 82, odometerEnd: 82, distanceKm: 84,
  accompanyingStaff: 160, remark: 140, reimbursedKm: 108,
  unreimbursedKm: 160, potentialReimbursementCents: 104,
};
// Physical print widths keep dates and numbers compact even when columns are hidden.
export const TRIP_PRINT_COLUMN_WIDTHS: Record<TripColumnId, number> = {
  sequenceNumber: 38, date: 64, startTime: 48, endTime: 48,
  routeLabel: 140, odometerStart: 54, odometerEnd: 54, distanceKm: 62,
  accompanyingStaff: 100, remark: 140, reimbursedKm: 80,
  unreimbursedKm: 112, potentialReimbursementCents: 70,
};
export const TRIP_TEXT_COLUMN_IDS: TripColumnId[] = ["routeLabel", "accompanyingStaff", "remark"];
export const TRIP_ACTION_COLUMN_WIDTH = 52;
export function screenTripColumnLayout(visibleColumns: TripColumnId[], containerWidth?: number, hasAction = false) {
  const columns = TRIP_COLUMNS.filter((column) => visibleColumns.includes(column.id));
  const actionWidth = hasAction ? TRIP_ACTION_COLUMN_WIDTH : 0;
  const minimumWidth = columns.reduce((sum, column) => sum + TRIP_SCREEN_COLUMN_WIDTHS[column.id], actionWidth);
  const tableWidth = Math.max(containerWidth ?? minimumWidth, minimumWidth);
  const extraPerColumn = (tableWidth - minimumWidth) / columns.length;
  return {
    tableWidth,
    actionWidth,
    columnWidths: columns.map((column) => TRIP_SCREEN_COLUMN_WIDTHS[column.id] + extraPerColumn),
  };
}
export const ALL_TRIP_COLUMN_IDS = TRIP_COLUMNS.map((column) => column.id);
export const tripColumnsSettingsSchema = z.object({
  visibleColumns: z.array(z.enum(ALL_TRIP_COLUMN_IDS)).min(1).max(TRIP_COLUMNS.length)
    .refine((columns) => new Set(columns).size === columns.length, "Spalten dürfen nicht mehrfach vorkommen."),
});
export function decodeTripColumns(value: string | null | undefined): TripColumnId[] {
  try {
    const result = tripColumnsSettingsSchema.safeParse({ visibleColumns: JSON.parse(value ?? "null") });
    return result.success ? ALL_TRIP_COLUMN_IDS.filter((id) => result.data.visibleColumns.includes(id)) : [...ALL_TRIP_COLUMN_IDS];
  } catch { return [...ALL_TRIP_COLUMN_IDS]; }
}
export function tripColumnValue(trip: TripDto, id: TripColumnId): string {
  if (id === "date") return trip.date.split("-").reverse().join(".");
  if (id === "potentialReimbursementCents") return formatEuro(trip[id]);
  const value = trip[id];
  if (["distanceKm", "reimbursedKm", "unreimbursedKm"].includes(id)) return `${value.toLocaleString("de-DE")} km`;
  return typeof value === "number" ? value.toLocaleString("de-DE") : value || "–";
}
export function tripColumnTotal(data: MonthDataDto, id: TripColumnId): string | null {
  switch (id) {
    case "distanceKm": return `${data.totalKm.toLocaleString("de-DE")} km`;
    case "reimbursedKm": return `${data.totalReimbursedKm.toLocaleString("de-DE")} km`;
    case "unreimbursedKm": return `${data.totalUnreimbursedKm.toLocaleString("de-DE")} km`;
    case "potentialReimbursementCents": return formatEuro(data.totalPotentialReimbursementCents);
    default: return null;
  }
}
