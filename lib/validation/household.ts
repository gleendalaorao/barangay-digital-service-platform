import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(120).optional(),
);

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const householdFormSchema = z.object({
  householdNo: requiredText("Household number"),
  address: requiredText("Address", 180),
  purok: optionalText,
  barangay: optionalText,
  city: optionalText,
  province: optionalText,
  headResidentId: optionalText,
  isActive: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export const householdListFilterSchema = z.object({
  householdNo: z.string().trim().optional().catch(undefined),
  head: z.string().trim().optional().catch(undefined),
  purok: z.string().trim().optional().catch(undefined),
  status: z.enum(["all", "active", "inactive"]).optional().catch("active"),
});

export type HouseholdFormInput = z.infer<typeof householdFormSchema>;
export type HouseholdListFilters = z.infer<typeof householdListFilterSchema>;
