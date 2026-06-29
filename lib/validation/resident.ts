import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(120).optional(),
);

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const residentFormSchema = z.object({
  firstName: requiredText("First name"),
  middleName: optionalText,
  lastName: requiredText("Last name"),
  suffix: optionalText,
  gender: optionalText,
  birthDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  civilStatus: optionalText,
  contactNumber: optionalText,
  occupation: optionalText,
  citizenship: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? "Filipino" : value),
    z.string().trim().max(80),
  ),
  address: requiredText("Address", 180),
  purok: optionalText,
  barangay: optionalText,
  city: optionalText,
  province: optionalText,
  isActive: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export const residentListFilterSchema = z.object({
  q: z.string().trim().optional().catch(undefined),
  purok: z.string().trim().optional().catch(undefined),
  gender: z.string().trim().optional().catch(undefined),
  status: z.enum(["all", "active", "inactive"]).optional().catch("active"),
});

export type ResidentFormInput = z.infer<typeof residentFormSchema>;
export type ResidentListFilters = z.infer<typeof residentListFilterSchema>;
