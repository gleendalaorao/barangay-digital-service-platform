"use server";

import { redirect } from "next/navigation";
import { ResidentAccountStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { formatResidentAccountName } from "@/lib/resident-accounts/format";
import { clearResidentSession, setResidentSession } from "@/lib/resident-accounts/session";
import { residentLoginSchema, residentSignupSchema } from "@/lib/validation/resident-account";

function parseSignupForm(formData: FormData) {
  return residentSignupSchema.parse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    suffix: formData.get("suffix"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    contactNumber: formData.get("contactNumber"),
    email: formData.get("email"),
    password: formData.get("password"),
    address: formData.get("address"),
    purok: formData.get("purok"),
    purpose: formData.get("purpose"),
  });
}

function parseLoginForm(formData: FormData) {
  return residentLoginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function submitResidentSignup(barangaySlug: string, formData: FormData) {
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { id: true, name: true },
  });

  if (!barangay) {
    throw new Error("Barangay not found.");
  }

  const parsed = parseSignupForm(formData);
  const existingAccount = await prisma.residentAccount.findUnique({
    where: {
      barangayId_email: {
        barangayId: barangay.id,
        email: parsed.email,
      },
    },
    select: { id: true },
  });

  if (existingAccount) {
    throw new Error("A resident account already exists for this email in this barangay.");
  }

  const account = await prisma.residentAccount.create({
    data: {
      barangayId: barangay.id,
      firstName: parsed.firstName,
      middleName: parsed.middleName,
      lastName: parsed.lastName,
      suffix: parsed.suffix,
      birthDate: parsed.birthDate,
      gender: parsed.gender,
      contactNumber: parsed.contactNumber,
      email: parsed.email,
      passwordHash: await hashPassword(parsed.password),
      addressLine: parsed.address,
      purok: parsed.purok,
      status: ResidentAccountStatus.PENDING_VERIFICATION,
      verificationRequests: {
        create: {
          barangayId: barangay.id,
          status: ResidentAccountStatus.PENDING_VERIFICATION,
          purpose: parsed.purpose,
        },
      },
    },
    select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true },
  });

  await logAuditEvent({
    barangayId: barangay.id,
    userId: null,
    action: "RESIDENT_SIGNUP_SUBMITTED",
    entity: "ResidentAccount",
    entityId: account.id,
    description: `Resident signup submitted by ${formatResidentAccountName(account)}.`,
  });

  await setResidentSession(account.id);
  redirect(`/b/${barangaySlug}/resident/dashboard?signedUp=1`);
}

export async function loginResident(barangaySlug: string, formData: FormData) {
  const barangay = await prisma.barangay.findUnique({
    where: { slug: barangaySlug },
    select: { id: true },
  });

  if (!barangay) {
    throw new Error("Barangay not found.");
  }

  const parsed = parseLoginForm(formData);
  const account = await prisma.residentAccount.findUnique({
    where: {
      barangayId_email: {
        barangayId: barangay.id,
        email: parsed.email,
      },
    },
    select: { id: true, passwordHash: true },
  });

  if (!account || !(await verifyPassword(parsed.password, account.passwordHash))) {
    throw new Error("Invalid resident email or password.");
  }

  await setResidentSession(account.id);
  redirect(`/b/${barangaySlug}/resident/dashboard`);
}

export async function logoutResident(barangaySlug: string) {
  await clearResidentSession();
  redirect(`/b/${barangaySlug}/resident/login`);
}
