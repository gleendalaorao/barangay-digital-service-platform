import { Role } from "@prisma/client";
import { z } from "zod";

export const barangayUserRoles = [Role.ADMIN, Role.SECRETARY, Role.CAPTAIN, Role.STAFF] as const;

const optionalPassword = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(8, "Password must be at least 8 characters.").max(120).optional(),
);

export const createBarangayUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email.").toLowerCase(),
  role: z.enum(barangayUserRoles),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters.").max(120),
  isActive: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export const updateBarangayUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  role: z.enum(barangayUserRoles),
  resetPassword: optionalPassword,
  isActive: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type CreateBarangayUserInput = z.infer<typeof createBarangayUserSchema>;
export type UpdateBarangayUserInput = z.infer<typeof updateBarangayUserSchema>;
