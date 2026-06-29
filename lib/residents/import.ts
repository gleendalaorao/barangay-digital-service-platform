import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import {
  residentImportFields,
  type MappingStatus,
  type ResidentImportColumnMapping,
  type ResidentImportField,
  type ResidentImportRow,
} from "@/lib/residents/import-shared";
export { residentImportFields };
export type { ResidentImportColumnMapping, ResidentImportField, ResidentImportRow };

export type ResidentImportMappingSession = {
  sessionId: string;
  fileName: string;
  totalRows: number;
  mappings: ResidentImportColumnMapping[];
  missingRequiredFields: ResidentImportField[];
};

export type ResidentImportPreviewRow = ResidentImportRow & {
  rowNumber: number;
  status: "valid" | "duplicate" | "invalid";
  reasons: string[];
};

export type ResidentImportPreview = {
  sessionId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  ignoredColumns: number;
  mappingMode: "automatic" | "manual";
  mappings: ResidentImportColumnMapping[];
  rows: ResidentImportPreviewRow[];
};

export type ResidentImportResult = {
  rowsRead: number;
  imported: number;
  duplicates: number;
  invalid: number;
  ignored: number;
  errorReportCsv: string;
};

type ParsedImportFile = {
  fileName: string;
  headers: string[];
  rows: unknown[][];
};

type StoredImportSession = ParsedImportFile & {
  createdAt: string;
};

const requiredFields: ResidentImportField[] = ["firstName", "lastName", "addressLine"];

const fieldLabels = new Map(residentImportFields.map((field) => [field.value, field.label]));

const headerSynonyms: Record<ResidentImportField, string[]> = {
  firstName: ["first name", "firstname", "given name", "givenname", "fname", "first", "given"],
  middleName: ["middle name", "middlename", "middle", "mi", "mname"],
  lastName: ["last name", "lastname", "surname", "family name", "familyname", "lname", "last"],
  suffix: ["suffix", "ext", "extension", "name suffix"],
  birthDate: ["birth date", "birthdate", "dob", "date of birth", "dateofbirth", "birthday"],
  gender: ["gender", "sex"],
  civilStatus: ["civil status", "civilstatus", "marital status", "maritalstatus"],
  contactNumber: ["contact", "contact number", "contactnumber", "mobile", "mobile no", "mobile no.", "mobileno", "phone", "cellphone", "cp number", "cpnumber"],
  occupation: ["occupation", "work", "job"],
  citizenship: ["citizenship", "nationality"],
  purok: ["purok", "sitio", "zone"],
  addressLine: ["address", "residence", "address line", "addressline", "home address", "street address"],
  addressBarangay: ["address barangay", "addressbarangay", "barangay"],
  city: ["city", "municipality", "city municipality", "city/municipality"],
  province: ["province"],
};

const synonymLookup = new Map<string, ResidentImportField>();

for (const [field, synonyms] of Object.entries(headerSynonyms) as [ResidentImportField, string[]][]) {
  synonyms.forEach((synonym) => synonymLookup.set(normalizeHeader(synonym), field));
}

const storageRoot = path.join(process.cwd(), ".app-storage", "resident-import");
const sessionRoot = path.join(storageRoot, "sessions");
const mappingPath = path.join(storageRoot, "mapping-preferences.json");

export async function analyzeResidentImportFile(file: File, barangayId: string): Promise<ResidentImportMappingSession> {
  const parsed = await parseResidentFile(file);
  const sessionId = crypto.randomUUID();

  await ensureStorage();
  await writeFile(
    path.join(sessionRoot, `${sessionId}.json`),
    JSON.stringify({
      ...parsed,
      createdAt: new Date().toISOString(),
    }),
    "utf8",
  );

  const preferences = await loadMappingPreferences(barangayId);
  const mappings = buildColumnMappings(parsed, preferences);

  return {
    sessionId,
    fileName: parsed.fileName,
    totalRows: parsed.rows.length,
    mappings,
    missingRequiredFields: getMissingRequiredFields(mappings),
  };
}

export async function previewResidentImportFromMapping(
  sessionId: string,
  mappings: ResidentImportColumnMapping[],
  barangayId: string,
): Promise<ResidentImportPreview> {
  const parsed = await readStoredImportSession(sessionId);
  const normalizedMappings = normalizeMappings(mappings, parsed);
  const normalizedRows = parsed.rows.map((cells, index) => normalizeRow(cells, normalizedMappings, index + 2));

  await markDuplicateRows(normalizedRows, barangayId);
  await saveMappingPreferences(barangayId, normalizedMappings);

  const hasManualMapping = normalizedMappings.some((mapping) => mapping.status === "manual");

  return {
    sessionId,
    fileName: parsed.fileName,
    totalRows: normalizedRows.length,
    validRows: normalizedRows.filter((row) => row.status === "valid").length,
    duplicateRows: normalizedRows.filter((row) => row.status === "duplicate").length,
    invalidRows: normalizedRows.filter((row) => row.status === "invalid").length,
    ignoredColumns: normalizedMappings.filter((mapping) => !mapping.systemField).length,
    mappingMode: hasManualMapping ? "manual" : "automatic",
    mappings: normalizedMappings,
    rows: normalizedRows,
  };
}

export async function importResidentRows(rows: ResidentImportPreviewRow[], barangayId: string): Promise<ResidentImportResult> {
  const candidates = rows.filter((row) => row.status === "valid");
  await markDuplicateRows(candidates, barangayId);

  const importable = candidates.filter((row) => row.status === "valid");
  const newDuplicates = candidates.filter((row) => row.status === "duplicate");
  const duplicates = rows.filter((row) => row.status === "duplicate").length + newDuplicates.length;
  const invalid = rows.filter((row) => row.status === "invalid").length;

  if (importable.length > 0) {
    await prisma.resident.createMany({
      data: importable.map((row) => ({
        barangayId,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
        suffix: row.suffix,
        birthDate: row.birthDate ? new Date(row.birthDate) : null,
        gender: row.gender,
        civilStatus: row.civilStatus,
        contactNumber: row.contactNumber,
        occupation: row.occupation,
        citizenship: row.citizenship || "Filipino",
        addressLine: row.addressLine,
        addressBarangay: row.addressBarangay,
        city: row.city,
        province: row.province,
        purok: row.purok,
        isActive: true,
      })),
    });
  }

  return {
    rowsRead: rows.length,
    imported: importable.length,
    duplicates,
    invalid,
    ignored: duplicates + invalid,
    errorReportCsv: buildErrorReportCsv([...rows.filter((row) => row.status !== "valid"), ...newDuplicates]),
  };
}

function buildColumnMappings(parsed: ParsedImportFile, preferences: Record<string, ResidentImportField>): ResidentImportColumnMapping[] {
  const usedFields = new Set<ResidentImportField>();

  return parsed.headers.map((header, columnIndex) => {
    const normalizedHeader = normalizeHeader(header);
    const savedField = preferences[normalizedHeader];
    const autoField = synonymLookup.get(normalizedHeader);
    const preferredField = savedField ?? autoField;
    const systemField = preferredField && !usedFields.has(preferredField) ? preferredField : "";

    if (systemField) {
      usedFields.add(systemField);
    }

    return {
      columnIndex,
      originalHeader: header || `Column ${columnIndex + 1}`,
      sampleValue: sampleValue(parsed.rows, columnIndex),
      systemField,
      status: systemField ? (savedField ? "saved" : "auto") : "unmapped",
    };
  });
}

function normalizeMappings(mappings: ResidentImportColumnMapping[], parsed: ParsedImportFile): ResidentImportColumnMapping[] {
  const seenFields = new Set<ResidentImportField>();

  return parsed.headers.map((header, columnIndex) => {
    const submitted = mappings.find((mapping) => mapping.columnIndex === columnIndex);
    const submittedField = submitted?.systemField || "";
    const systemField: ResidentImportField | "" = isResidentImportField(submittedField) && !seenFields.has(submittedField) ? submittedField : "";

    if (systemField) {
      seenFields.add(systemField);
    }

    const originalStatus = submitted?.status ?? "unmapped";
    const status: MappingStatus = systemField
      ? originalStatus === "auto" || originalStatus === "saved"
        ? originalStatus
        : "manual"
      : "unmapped";

    return {
      columnIndex,
      originalHeader: header || `Column ${columnIndex + 1}`,
      sampleValue: sampleValue(parsed.rows, columnIndex),
      systemField,
      status,
    };
  });
}

async function parseResidentFile(file: File): Promise<ParsedImportFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    raw: true,
    defval: "",
  });

  if (matrix.length < 2) {
    throw new Error("The uploaded file must include a header row and at least one resident row.");
  }

  const headers = matrix[0].map((header, index) => optionalText(header) ?? `Column ${index + 1}`);
  const rows = matrix.slice(1).filter((row) => row.some((cell) => optionalText(cell)));

  if (rows.length === 0) {
    throw new Error("The uploaded file does not contain resident rows.");
  }

  return {
    fileName: file.name,
    headers,
    rows,
  };
}

function normalizeRow(cells: unknown[], mappings: ResidentImportColumnMapping[], rowNumber: number): ResidentImportPreviewRow {
  const raw: Partial<Record<ResidentImportField, unknown>> = {};

  for (const mapping of mappings) {
    if (mapping.systemField) {
      raw[mapping.systemField] = cells[mapping.columnIndex];
    }
  }

  const row: ResidentImportPreviewRow = {
    rowNumber,
    firstName: textValue(raw.firstName),
    middleName: optionalText(raw.middleName),
    lastName: textValue(raw.lastName),
    suffix: optionalText(raw.suffix),
    birthDate: dateValue(raw.birthDate),
    gender: optionalText(raw.gender),
    civilStatus: optionalText(raw.civilStatus),
    contactNumber: optionalText(raw.contactNumber),
    occupation: optionalText(raw.occupation),
    citizenship: optionalText(raw.citizenship) ?? "Filipino",
    addressLine: textValue(raw.addressLine),
    addressBarangay: optionalText(raw.addressBarangay),
    city: optionalText(raw.city),
    province: optionalText(raw.province),
    purok: optionalText(raw.purok),
    status: "valid",
    reasons: [],
  };

  for (const requiredField of requiredFields) {
    if (!row[requiredField]) {
      row.reasons.push(`Missing ${fieldLabels.get(requiredField)}.`);
    }
  }

  if (raw.birthDate && !row.birthDate) {
    row.reasons.push("Invalid Birth Date.");
  }

  if (row.reasons.length > 0) {
    row.status = "invalid";
  }

  return row;
}

async function markDuplicateRows(rows: ResidentImportPreviewRow[], barangayId: string) {
  const seen = new Set<string>();
  const validRows = rows.filter((row) => row.status !== "invalid");

  if (validRows.length === 0) {
    return;
  }

  for (const row of validRows) {
    const key = duplicateKey(row);

    if (seen.has(key)) {
      row.status = "duplicate";
      row.reasons = [...row.reasons, "Possible duplicate within uploaded file."];
    }

    seen.add(key);
  }

  const existingResidents = await prisma.resident.findMany({
    where: {
      barangayId,
      OR: validRows.map((row) => ({
        firstName: { equals: row.firstName, mode: "insensitive" },
        lastName: { equals: row.lastName, mode: "insensitive" },
        birthDate: row.birthDate ? new Date(row.birthDate) : null,
      })),
    },
    select: {
      firstName: true,
      lastName: true,
      birthDate: true,
    },
  });
  const existingKeys = new Set(
    existingResidents.map((resident) =>
      duplicateKey({
        firstName: resident.firstName,
        lastName: resident.lastName,
        birthDate: resident.birthDate ? resident.birthDate.toISOString().slice(0, 10) : null,
      }),
    ),
  );

  for (const row of validRows) {
    if (existingKeys.has(duplicateKey(row))) {
      row.status = "duplicate";
      row.reasons = [...row.reasons, "Possible duplicate of an existing resident."];
    }
  }
}

function duplicateKey(row: Pick<ResidentImportRow, "firstName" | "lastName" | "birthDate">) {
  return [row.firstName.trim().toLowerCase(), row.lastName.trim().toLowerCase(), row.birthDate ?? ""].join("|");
}

function getMissingRequiredFields(mappings: ResidentImportColumnMapping[]) {
  const mappedFields = new Set(mappings.map((mapping) => mapping.systemField).filter(Boolean));
  return requiredFields.filter((field) => !mappedFields.has(field));
}

async function readStoredImportSession(sessionId: string): Promise<ParsedImportFile> {
  const content = await readFile(path.join(sessionRoot, `${sessionId}.json`), "utf8");
  const session = JSON.parse(content) as StoredImportSession;

  return {
    fileName: session.fileName,
    headers: session.headers,
    rows: session.rows,
  };
}

async function ensureStorage() {
  await mkdir(sessionRoot, { recursive: true });
}

async function loadMappingPreferences(barangayId: string): Promise<Record<string, ResidentImportField>> {
  try {
    const content = await readFile(mappingPath, "utf8");
    const allPreferences = JSON.parse(content) as Record<string, Record<string, ResidentImportField>>;
    return allPreferences[barangayId] ?? {};
  } catch {
    return {};
  }
}

async function saveMappingPreferences(barangayId: string, mappings: ResidentImportColumnMapping[]) {
  await ensureStorage();

  let allPreferences: Record<string, Record<string, ResidentImportField>> = {};

  try {
    allPreferences = JSON.parse(await readFile(mappingPath, "utf8")) as Record<string, Record<string, ResidentImportField>>;
  } catch {
    allPreferences = {};
  }

  allPreferences[barangayId] = {
    ...(allPreferences[barangayId] ?? {}),
  };

  for (const mapping of mappings) {
    if (mapping.systemField) {
      allPreferences[barangayId][normalizeHeader(mapping.originalHeader)] = mapping.systemField;
    }
  }

  await writeFile(mappingPath, JSON.stringify(allPreferences, null, 2), "utf8");
}

function buildErrorReportCsv(rows: ResidentImportPreviewRow[]) {
  const outputRows = [
    ["Row", "Status", "Reasons", "First Name", "Last Name", "Birth Date", "Address"],
    ...rows.map((row) => [row.rowNumber, row.status, row.reasons.join(" "), row.firstName, row.lastName, row.birthDate ?? "", row.addressLine]),
  ];

  return outputRows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function sampleValue(rows: unknown[][], columnIndex: number) {
  for (const row of rows.slice(0, 10)) {
    const value = optionalText(row[columnIndex]);

    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isResidentImportField(value: unknown): value is ResidentImportField {
  return residentImportFields.some((field) => field.value === value);
}

function textValue(value: unknown) {
  return optionalText(value) ?? "";
}

function optionalText(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text ? text : null;
}

function dateValue(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toISOString().slice(0, 10);
    }
  }

  const text = String(value).trim();
  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}
