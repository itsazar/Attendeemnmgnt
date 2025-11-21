import * as XLSX from "xlsx";

export type ParticipantRow = {
  fullName: string;
  email: string;
  company?: string;
  city?: string;
};

const REQUIRED_HEADERS = ["full name", "email", "company", "city"];

const normalizeHeader = (header: string) => header?.trim().toLowerCase() ?? "";

const sanitizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : value ? String(value).trim() : "";

export function parseParticipantWorkbook(buffer: Buffer): ParticipantRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows.length) {
    return [];
  }

  const headerMap = new Map<string, string>();
  Object.keys(rows[0] ?? {}).forEach((key) => {
    headerMap.set(normalizeHeader(key), key);
  });

  const hasRequiredHeaders = REQUIRED_HEADERS.every((header) => headerMap.has(header));
  if (!hasRequiredHeaders) {
    throw new Error(
      `Missing required headers. Expected: ${REQUIRED_HEADERS.join(", ")}`
    );
  }

  const normalizedRows = rows
    .map((row) => {
      const email = sanitizeText(row[headerMap.get("email") ?? ""]).toLowerCase();
      return {
        fullName: sanitizeText(row[headerMap.get("full name") ?? ""]),
        email,
        company: sanitizeText(row[headerMap.get("company") ?? ""]),
        city: sanitizeText(row[headerMap.get("city") ?? ""]),
      };
    })
    .filter((row) => row.email);

  const deduped = new Map<string, ParticipantRow>();
  normalizedRows.forEach((row) => {
    if (!deduped.has(row.email)) {
      deduped.set(row.email, row);
    }
  });

  return Array.from(deduped.values());
}

export function buildWorkbookFromRows(
  sheetName: string,
  rows: Record<string, unknown>[]
): Buffer {
  return buildWorkbook([{ name: sheetName, rows }]);
}

export function buildWorkbook(
  sheets: Array<{ name: string; rows: Record<string, unknown>[] }>
): Buffer {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

