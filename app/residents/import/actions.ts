"use server";

import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import {
  analyzeResidentImportFile,
  importResidentRows,
  previewResidentImportFromMapping,
  type ResidentImportColumnMapping,
  type ResidentImportMappingSession,
  type ResidentImportPreview,
  type ResidentImportResult,
} from "@/lib/residents/import";
import { canImportResidents, requireResidentImportSession } from "@/lib/residents/import-access";

export type ResidentImportState = {
  error?: string;
  mappingSession?: ResidentImportMappingSession;
  preview?: ResidentImportPreview;
  result?: ResidentImportResult;
};

export async function analyzeResidentImportAction(_state: ResidentImportState, formData: FormData): Promise<ResidentImportState> {
  try {
    const session = await requireResidentImportSession();

    if (!canImportResidents(session.role)) {
      return { error: "Only barangay admins and secretaries can import residents." };
    }

    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Upload an Excel or CSV file." };
    }

    const mappingSession = await analyzeResidentImportFile(file, session.barangayId);
    return { mappingSession };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to analyze resident import file." };
  }
}

export async function previewResidentImportAction(_state: ResidentImportState, formData: FormData): Promise<ResidentImportState> {
  try {
    const session = await requireResidentImportSession();

    if (!canImportResidents(session.role)) {
      return { error: "Only barangay admins and secretaries can import residents." };
    }

    const sessionId = String(formData.get("sessionId") ?? "");
    const mappings = parseMappingForm(formData);

    if (!sessionId) {
      return { error: "Upload and analyze a file before previewing records." };
    }

    const preview = await previewResidentImportFromMapping(sessionId, mappings, session.barangayId);
    return { preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to preview resident import." };
  }
}

export async function importResidentRowsAction(_state: ResidentImportState, formData: FormData): Promise<ResidentImportState> {
  try {
    const session = await requireResidentImportSession();

    if (!canImportResidents(session.role)) {
      return { error: "Only barangay admins and secretaries can import residents." };
    }

    const payload = String(formData.get("payload") ?? "");

    if (!payload) {
      return { error: "Preview the import file before saving." };
    }

    const preview = JSON.parse(payload) as ResidentImportPreview;
    const result = await importResidentRows(preview.rows, session.barangayId);

    await logAuditEvent({
      barangayId: session.barangayId,
      userId: session.userId,
      action: "RESIDENT_IMPORT_COMPLETED",
      entity: "Resident",
      description: `Imported ${result.imported} residents from ${preview.fileName}. Skipped ${result.duplicates} duplicates and ${result.invalid} invalid rows.`,
      metadata: {
        rowsRead: result.rowsRead,
        imported: result.imported,
        duplicates: result.duplicates,
        invalid: result.invalid,
        ignored: result.ignored,
        fileName: preview.fileName,
        mappingMode: preview.mappingMode,
      },
    });

    revalidatePath("/residents");
    revalidatePath("/residents/import");

    return { result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to import residents." };
  }
}

function parseMappingForm(formData: FormData): ResidentImportColumnMapping[] {
  const columnIndexes = formData.getAll("columnIndex").map((value) => Number(value));

  return columnIndexes.map((columnIndex) => {
    const originalHeader = String(formData.get(`header-${columnIndex}`) ?? "");
    const sampleValue = String(formData.get(`sample-${columnIndex}`) ?? "");
    const originalField = String(formData.get(`originalField-${columnIndex}`) ?? "");
    const submittedField = String(formData.get(`field-${columnIndex}`) ?? "");

    return {
      columnIndex,
      originalHeader,
      sampleValue,
      systemField: submittedField as ResidentImportColumnMapping["systemField"],
      status: !submittedField ? "unmapped" : submittedField === originalField ? "auto" : "manual",
    };
  });
}
