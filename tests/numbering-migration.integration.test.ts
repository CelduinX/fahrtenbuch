import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

describe("Migration der Startnummer", () => {
  it("ergänzt alte Datenbanken ohne Änderungen an IDs und vorhandenen Nummern", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fahrtenbuch-numbering-"));
    const databasePath = path.join(directory, "legacy.db");
    try {
      const db = new Database(databasePath);
      const schema = fs.readFileSync(path.join(process.cwd(), "lib/db/migrations/0000_initial.sql"), "utf8")
        .replace(/^  numbering_start INTEGER CHECK\([^\r\n]+\),\r?\n/m, "");
      db.exec(schema);
      db.prepare(`INSERT INTO trips (id, date, start_time, end_time, origin_snapshot, destination_snapshot,
        distance_km_snapshot, reimbursed_km_snapshot, odometer_start, created_at, updated_at)
        VALUES (?, ?, '08:55', '09:15', 'A', 'B', 10, 10, 100, '2024-01-01', '2024-01-01')`)
        .run(42, "2024-05-14");
      db.prepare(`INSERT INTO trips (id, date, start_time, end_time, origin_snapshot, destination_snapshot,
        distance_km_snapshot, reimbursed_km_snapshot, odometer_start, created_at, updated_at)
        VALUES (?, ?, '08:55', '09:15', 'A', 'B', 10, 10, 110, '2024-01-01', '2024-01-01')`)
        .run(57, "2024-05-14");
      db.close();

      execFileSync(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], {
        cwd: process.cwd(), env: { ...process.env, DATABASE_PATH: databasePath }, stdio: "pipe",
      });
      const migrated = new Database(databasePath, { readonly: true });
      expect(migrated.prepare("SELECT id, numbering_start AS numberingStart FROM trips ORDER BY date, start_time, id").all())
        .toEqual([{ id: 42, numberingStart: null }, { id: 57, numberingStart: null }]);
      migrated.close();
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
