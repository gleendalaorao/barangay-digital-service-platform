import { z } from "zod";

const optionalText = (max = 240) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const requiredText = (label: string, max = 160) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("Enter a valid URL.").max(300).optional(),
);

const optionalColor = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a color like #047857.").optional(),
);

export const websiteSettingsSchema = z.object({
  welcomeTitle: optionalText(160),
  welcomeMessage: optionalText(800),
  publicServiceTagline: optionalText(220),
  logoUrl: optionalUrl,
  sealUrl: optionalUrl,
  primaryColor: optionalColor,
  secondaryColor: optionalColor,
  facebookPageUrl: optionalUrl,
  officeHours: optionalText(160),
  officeAddress: optionalText(220),
  contactNumber: optionalText(80),
  contactEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Enter a valid email.").optional(),
  ),
});

export const publicOfficialSchema = z.object({
  id: optionalText(80),
  name: requiredText("Name"),
  position: requiredText("Position"),
  contact: optionalText(100),
  photoUrl: optionalUrl,
  displayOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(false),
});

export const publicServiceSchema = z.object({
  id: optionalText(80),
  name: requiredText("Service name"),
  description: requiredText("Description", 1000),
  requirements: optionalText(1200),
  processingTime: optionalText(120),
  feeText: optionalText(120),
  attachmentUrl: optionalUrl,
  requestLink: optionalText(300),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.coerce.boolean().default(false),
});
