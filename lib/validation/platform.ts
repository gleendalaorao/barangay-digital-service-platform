import { Role } from "@prisma/client";
import { z } from "zod";

const requiredText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

export const barangayTenantSchema = z.object({
  name: requiredText("Barangay name"),
  municipality: requiredText("Municipality"),
  province: requiredText("Province"),
  region: requiredText("Region"),
  slug: requiredText("Slug", 80)
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  contactEmail: z.string().trim().email("Enter a valid contact email.").optional().or(z.literal("")),
  contactNumber: z.string().trim().max(40, "Contact number is too long.").optional().or(z.literal("")),
});

export const createBarangayTenantSchema = barangayTenantSchema.extend({
  adminName: requiredText("Initial admin name"),
  adminEmail: z.string().trim().email("Enter a valid admin email."),
  adminPassword: z.string().min(8, "Temporary password must be at least 8 characters."),
});

export const initialAdminRole = Role.ADMIN;
