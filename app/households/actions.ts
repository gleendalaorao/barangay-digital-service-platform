"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireHouseholdBarangayId } from "@/lib/households/access";
import { householdFormSchema } from "@/lib/validation/household";

function parseHouseholdForm(formData: FormData) {
  return householdFormSchema.parse({
    householdNo: formData.get("householdNo"),
    address: formData.get("address"),
    purok: formData.get("purok"),
    barangay: formData.get("barangay"),
    city: formData.get("city"),
    province: formData.get("province"),
    headResidentId: formData.get("headResidentId"),
    isActive: formData.get("isActive"),
  });
}

async function assertActiveResidentInBarangay(residentId: string | undefined, barangayId: string) {
  if (!residentId) {
    return;
  }

  const resident = await prisma.resident.findFirst({
    where: {
      id: residentId,
      barangayId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!resident) {
    throw new Error("Selected household head must be an active resident in this barangay.");
  }
}

async function toHouseholdData(formData: FormData, barangayId: string) {
  const parsed = parseHouseholdForm(formData);
  await assertActiveResidentInBarangay(parsed.headResidentId, barangayId);

  return {
    householdNo: parsed.householdNo,
    addressLine: parsed.address,
    addressBarangay: parsed.barangay,
    city: parsed.city,
    province: parsed.province,
    purok: parsed.purok,
    headResidentId: parsed.headResidentId,
    isActive: parsed.isActive,
  };
}

export async function createHousehold(formData: FormData) {
  const barangayId = await requireHouseholdBarangayId();
  const data = await toHouseholdData(formData, barangayId);

  const household = await prisma.household.create({
    data: {
      ...data,
      barangayId,
    },
    select: {
      id: true,
    },
  });

  await logAuditEvent({
    barangayId,
    action: "HOUSEHOLD_CREATED",
    entity: "Household",
    entityId: household.id,
    description: `Created household ${data.householdNo}.`,
  });

  revalidatePath("/households");
  redirect(`/households/${household.id}?created=1`);
}

export async function updateHousehold(id: string, formData: FormData) {
  const barangayId = await requireHouseholdBarangayId();
  const data = await toHouseholdData(formData, barangayId);

  await prisma.household.update({
    where: {
      id,
      barangayId,
    },
    data,
  });

  await logAuditEvent({
    barangayId,
    action: "HOUSEHOLD_UPDATED",
    entity: "Household",
    entityId: id,
    description: `Updated household ${data.householdNo}.`,
  });

  revalidatePath("/households");
  revalidatePath(`/households/${id}`);
  redirect(`/households/${id}?updated=1`);
}

export async function deactivateHousehold(formData: FormData) {
  const barangayId = await requireHouseholdBarangayId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Household id is required.");
  }

  await prisma.household.update({
    where: {
      id,
      barangayId,
    },
    data: {
      isActive: false,
    },
  });

  await logAuditEvent({
    barangayId,
    action: "HOUSEHOLD_DEACTIVATED",
    entity: "Household",
    entityId: id,
    description: "Deactivated household record.",
  });

  revalidatePath("/households");
  revalidatePath(`/households/${id}`);
  redirect("/households?deactivated=1");
}

export async function addHouseholdMember(householdId: string, formData: FormData) {
  const barangayId = await requireHouseholdBarangayId();
  const residentId = String(formData.get("residentId") ?? "");

  if (!residentId) {
    throw new Error("Resident is required.");
  }

  const household = await prisma.household.findFirst({
    where: {
      id: householdId,
      barangayId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!household) {
    throw new Error("Household not found.");
  }

  await prisma.resident.update({
    where: {
      id: residentId,
      barangayId,
      isActive: true,
      householdId: null,
    },
    data: {
      householdId,
    },
  });

  await logAuditEvent({
    barangayId,
    action: "HOUSEHOLD_MEMBER_ADDED",
    entity: "Household",
    entityId: householdId,
    description: `Added resident ${residentId} to household.`,
  });

  revalidatePath(`/households/${householdId}`);
}

export async function removeHouseholdMember(householdId: string, formData: FormData) {
  const barangayId = await requireHouseholdBarangayId();
  const residentId = String(formData.get("residentId") ?? "");

  if (!residentId) {
    throw new Error("Resident is required.");
  }

  await prisma.resident.update({
    where: {
      id: residentId,
      barangayId,
      householdId,
    },
    data: {
      householdId: null,
    },
  });

  await logAuditEvent({
    barangayId,
    action: "HOUSEHOLD_MEMBER_REMOVED",
    entity: "Household",
    entityId: householdId,
    description: `Removed resident ${residentId} from household.`,
  });

  revalidatePath(`/households/${householdId}`);
}
