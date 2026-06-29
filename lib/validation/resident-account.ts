import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(240).optional(),
);

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const residentSignupSchema = z.object({
  firstName: requiredText("First name"),
  middleName: optionalText,
  lastName: requiredText("Last name"),
  suffix: optionalText,
  birthDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  gender: optionalText,
  contactNumber: requiredText("Contact number", 40),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  address: requiredText("Address", 180),
  purok: optionalText,
  purpose: optionalText,
});

export const residentLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const verificationReviewSchema = z.object({
  id: requiredText("Verification request id", 80),
  staffNotes: optionalText,
});

export type ResidentSignupInput = z.infer<typeof residentSignupSchema>;
