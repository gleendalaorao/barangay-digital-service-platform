import { CertificateStatus, CertificateType } from "@prisma/client";
import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(240).optional(),
);

export const certificateCreateSchema = z.object({
  residentId: z.string().trim().min(1, "Resident is required."),
  certificateType: z.nativeEnum(CertificateType),
  purpose: z.string().trim().min(1, "Purpose is required.").max(180),
  remarks: optionalText,
});

export const certificateListFilterSchema = z.object({
  controlNumber: z.string().trim().optional().catch(undefined),
  resident: z.string().trim().optional().catch(undefined),
  certificateType: z.nativeEnum(CertificateType).optional().catch(undefined),
  status: z.nativeEnum(CertificateStatus).optional().catch(undefined),
  dateFrom: z.string().trim().optional().catch(undefined),
  dateTo: z.string().trim().optional().catch(undefined),
});

export type CertificateCreateInput = z.infer<typeof certificateCreateSchema>;
export type CertificateListFilters = z.infer<typeof certificateListFilterSchema>;
