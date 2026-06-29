import { CertificateType } from "@prisma/client";
import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(240).optional(),
);

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const publicRequestSchema = z.object({
  certificateType: z.nativeEnum(CertificateType),
  purpose: requiredText("Purpose", 180),
  firstName: requiredText("First name"),
  middleName: optionalText,
  lastName: requiredText("Last name"),
  suffix: optionalText,
  birthDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  contactNumber: requiredText("Contact number", 40),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional(),
  ),
  address: requiredText("Address", 180),
  purok: optionalText,
  notes: optionalText,
});

export const publicTrackSchema = z.object({
  requestNumber: requiredText("Request number", 80),
  contactNumber: requiredText("Contact number", 40),
});

export type PublicRequestInput = z.infer<typeof publicRequestSchema>;
export type PublicTrackInput = z.infer<typeof publicTrackSchema>;
