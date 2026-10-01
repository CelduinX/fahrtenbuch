import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureDatabaseReady } from "@/lib/db";
import { getBackupDirectory } from "@/lib/backups";
import { createRoutePair } from "@/lib/repositories/routes";
import {
  createTrip,
  getTripDateRange,
  getTripsForDateRange,
  getTripsForMonth,
  importTripsFromCsv,
} from "@/lib/repositories/trips";
import { parseTripCsv, serializeTripCsv, type TripCsvRow } from "@/lib/trip-csv";

describe("CSV-Import und -Export", () => {
  const createdBackups: string[] = [];
  const importedRow: TripCsvRow = {
    date: "2024-05-14",
    startTime: "07:30",
    endTime: "08:15",
    routeLabel: "Freier Importweg",
    odometerStart: 5000,
    odometerEnd: 5017,
  };

  beforeAll(() => ensureDatabaseReady());

  afterAll(() => {
    for (const backupId of createdBackups) {
      const backupPath = path.join(getBackupDirectory(), backupId);
      if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    }
  });

  it("exportiert den inklusiven Zeitraum chronologisch im gemeinsamen Format", async () => {
    const route = await createRoutePair({
      placeA: "Büro",
      placeB: "Kunde",
      distanceKm: 18,
      reimbursedKm: 14,
      durationMinutes: 30,
    });
    await createTrip({
      date: "2026-07-28",
      startTime: "08:00",
      endTime: "08:30",
      odometerStart: 1000,
      routePairId: route.id,
      direction: "A_TO_B",
    });

    const exported = await getTripsForDateRange("2026-07-28", "2026-07-28");
    const parsed = parseTripCsv(serializeTripCsv(exported));

    expect(parsed).toEqual([{
      numberingStart: null,
      originFullName: "", destinationFullName: "", accompanyingStaff: "", remark: "",
      distanceKm: 18, reimbursedKm: 14, unreimbursedKm: 4, reimbursementRateCents: 40, potentialReimbursementCents: 560,
      date: "2026-07-28",
      startTime: "08:00",
      endTime: "08:30",
      routeLabel: "Büro → Kunde",
      odometerStart: 1000,
      odometerEnd: 1018,
    }]);
  });

  it("legt freie Fahrten atomar an, überspringt Dubletten und erstellt eine Sicherung", async () => {
    const result = await importTripsFromCsv([importedRow, importedRow]);
    if (result.backup) createdBackups.push(result.backup.id);

    expect(result).toEqual(expect.objectContaining({ imported: 1, skipped: 1 }));
    expect(result.backup).toEqual(expect.objectContaining({ kind: "safety" }));
    expect(fs.existsSync(path.join(getBackupDirectory(), result.backup!.id))).toBe(true);
    expect(getTripDateRange()).toEqual({ firstDate: "2024-05-14", lastDate: "2026-07-28" });

    const [trip] = (await getTripsForMonth("2024-05")).trips;
    expect(trip).toEqual(expect.objectContaining({
      routePairId: null,
      direction: null,
      routeLabel: "Freier Importweg",
      distanceKm: 17,
      reimbursedKm: 17,
      reimbursementRateCents: 40,
      odometerStart: 5000,
      odometerEnd: 5017,
      isChecked: false,
    }));

    const duplicateResult = await importTripsFromCsv([importedRow]);
    expect(duplicateResult).toEqual(expect.objectContaining({ imported: 0, skipped: 1, backup: null }));
  });

  it("erhält die Startnummer beim CSV-Rundlauf und liest das bisherige vollständige Format", async () => {
    const row = { ...importedRow, date: "2024-05-15", numberingStart: 17 };
    const csv = serializeTripCsv([row]);
    expect(parseTripCsv(csv)[0].numberingStart).toBe(17);
    const imported = await importTripsFromCsv(parseTripCsv(csv));
    if (imported.backup) createdBackups.push(imported.backup.id);
    const restored = (await getTripsForMonth("2024-05")).trips.find((trip) => trip.date === row.date);
    expect(restored).toMatchObject({ numberingStart: 17, sequenceNumber: 17 });
    expect(parseTripCsv(serializeTripCsv([restored!]))[0].numberingStart).toBe(17);
    const oldCsv = csv.trimEnd().split("\r\n").map((line) => line.slice(0, line.lastIndexOf(";"))).join("\r\n");
    expect(parseTripCsv(oldCsv)[0].numberingStart).toBeUndefined();
    expect(() => parseTripCsv(csv.replace(/;17\r\n$/, ";0\r\n"))).toThrow(/Startnummer/);
  });
});
