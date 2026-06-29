import { z } from "zod";

const optionalText = (max = 180) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("Enter a valid URL.").max(300).optional(),
);

export const barangaySettingsSchema = z.object({
  name: requiredText("Barangay name"),
  barangayCode: requiredText("Barangay code", 40),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  region: requiredText("Region"),
  province: requiredText("Province"),
  municipality: requiredText("City/Municipality"),
  officeAddress: optionalText(220),
  contactNumber: optionalText(80),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Enter a valid email.").optional(),
  ),
  officeHours: optionalText(120),
  captainName: optionalText(),
  secretaryName: optionalText(),
  treasurerName: optionalText(),
  skChairpersonName: optionalText(),
  officialHeaderLine1: optionalText(160),
  officialHeaderLine2: optionalText(160),
  officialHeaderLine3: optionalText(160),
  certificateFooterNote: optionalText(240),
  logoUrl: optionalUrl,
  sealUrl: optionalUrl,
});

export type BarangaySettingsInput = z.infer<typeof barangaySettingsSchema>;
