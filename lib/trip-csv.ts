export const LEGACY_TRIP_CSV_HEADERS = ["Datum", "Beginn", "Ende", "Reiseweg", "KM Beginn", "KM Ende"] as const;
export const TRIP_CSV_HEADERS = [...LEGACY_TRIP_CSV_HEADERS, "Ort Start ausgeschrieben", "Ort Ziel ausgeschrieben", "Mitgenommene Bedienstete", "Bemerkung"] as const;
export const MAX_TRIP_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_TRIP_CSV_ROWS = 10_000;

export type TripCsvRow = {
  originFullName?: string;
  destinationFullName?: string;
  accompanyingStaff?: string;
  remark?: string;
  date: string;
  startTime: string;
  endTime: string;
  routeLabel: string;
  odometerStart: number;
  odometerEnd: number;
};

type ParsedCsvRow = {
  values: string[];
  line: number;
};

function parseRows(text: string): ParsedCsvRow[] {
  const rows: ParsedCsvRow[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
        if (char === "\n") line += 1;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push({ values: row, line: rowLine });
      row = [];
      field = "";
      line += 1;
      rowLine = line;
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error(`Zeile ${rowLine}: Nicht geschlossenes Anführungszeichen.`);
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value !== "")) rows.push({ values: row, line: rowLine });
  }
  return rows;
}

function isValidDate(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function parseKilometers(value: string, line: number, label: string) {
  if (!/^\d+$/.test(value)) throw new Error(`Zeile ${line}: ${label} muss eine nichtnegative ganze Zahl sein.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 100_000_000) {
    throw new Error(`Zeile ${line}: ${label} liegt außerhalb des erlaubten Bereichs.`);
  }
  return parsed;
}

export function parseTripCsv(text: string): TripCsvRow[] {
  if (!text.trim()) throw new Error("Die CSV-Datei ist leer.");
  if (text.includes("\uFFFD")) throw new Error("Die CSV-Datei ist nicht gültig UTF-8-codiert.");
  const rows = parseRows(text);
  const header = rows[0]?.values;
  const legacy = JSON.stringify(header) === JSON.stringify(LEGACY_TRIP_CSV_HEADERS);
  if (!header || (!legacy && JSON.stringify(header) !== JSON.stringify(TRIP_CSV_HEADERS))) {
    throw new Error(`Die Kopfzeile muss exakt „${TRIP_CSV_HEADERS.join(";")}“ lauten.`);
  }
  const dataRows = rows.slice(1);
  if (dataRows.length === 0) throw new Error("Die CSV-Datei enthält keine Fahrten.");
  if (dataRows.length > MAX_TRIP_CSV_ROWS) {
    throw new Error(`Die CSV-Datei darf höchstens ${MAX_TRIP_CSV_ROWS.toLocaleString("de-DE")} Fahrten enthalten.`);
  }

  return dataRows.map(({ values, line }) => {
    const expectedLength = legacy ? LEGACY_TRIP_CSV_HEADERS.length : TRIP_CSV_HEADERS.length;
    if (values.length !== expectedLength) {
      throw new Error(`Zeile ${line}: Erwartet werden genau ${expectedLength} Felder.`);
    }
    const [date, startTime, endTime, routeRaw, odometerStartRaw, odometerEndRaw] = values;
    const routeLabel = routeRaw.trim();
    if (!isValidDate(date)) throw new Error(`Zeile ${line}: Ungültiges Datum; erwartet wird YYYY-MM-DD.`);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      throw new Error(`Zeile ${line}: Ungültiger Beginn; erwartet wird HH:MM.`);
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime) {
      throw new Error(`Zeile ${line}: Das Ende muss im Format HH:MM nach dem Beginn liegen.`);
    }
    if (!routeLabel || routeLabel.length > 240 || /[\r\n]/.test(routeLabel)) {
      throw new Error(`Zeile ${line}: Der Reiseweg muss zwischen 1 und 240 Zeichen lang sein.`);
    }
    const odometerStart = parseKilometers(odometerStartRaw, line, "KM Beginn");
    const odometerEnd = parseKilometers(odometerEndRaw, line, "KM Ende");
    if (odometerEnd <= odometerStart) {
      throw new Error(`Zeile ${line}: KM Ende muss größer als KM Beginn sein.`);
    }
    const extra = legacy ? {} : {
      originFullName: values[6].trim(), destinationFullName: values[7].trim(),
      accompanyingStaff: values[8].trim(), remark: values[9].trim(),
    };
    if ((extra.originFullName?.length ?? 0) > 240 || (extra.destinationFullName?.length ?? 0) > 240
      || (extra.accompanyingStaff?.length ?? 0) > 2000 || (extra.remark?.length ?? 0) > 2000) {
      throw new Error(`Zeile ${line}: Eine Zusatzangabe überschreitet die erlaubte Textlänge.`);
    }
    return { date, startTime, endTime, routeLabel, odometerStart, odometerEnd, ...extra };
  });
}

function escapeCsvField(value: string | number) {
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeTripCsv(rows: TripCsvRow[]) {
  const lines = [
    TRIP_CSV_HEADERS.join(";"),
    ...rows.map((row) => [
      row.date,
      row.startTime,
      row.endTime,
      row.routeLabel,
      row.odometerStart,
      row.odometerEnd,
      row.originFullName ?? "",
      row.destinationFullName ?? "",
      row.accompanyingStaff ?? "",
      row.remark ?? "",
    ].map(escapeCsvField).join(";")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function tripCsvDuplicateKey(row: TripCsvRow, extended = false) {
  return JSON.stringify([
    row.date,
    row.startTime,
    row.endTime,
    row.routeLabel,
    row.odometerStart,
    row.odometerEnd,
    ...(extended ? [row.originFullName ?? "", row.destinationFullName ?? "", row.accompanyingStaff ?? "", row.remark ?? ""] : []),
  ]);
}
