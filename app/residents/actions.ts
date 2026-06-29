"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireResidentBarangayId } from "@/lib/residents/access";
import { residentFormSchema } from "@/lib/validation/resident";

function parseResidentForm(formData: FormData) {
  return residentFormSchema.parse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    suffix: formData.get("suffix"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    civilStatus: formData.get("civilStatus"),
    contactNumber: formData.get("contactNumber"),
    occupation: formData.get("occupation"),
    citizenship: formData.get("citizenship"),
    address: formData.get("address"),
    purok: formData.get("purok"),
    barangay: formData.get("barangay"),
    city: formData.get("city"),
    province: formData.get("province"),
    isActive: formData.get("isActive"),
  });
}

function toResidentData(formData: FormData) {
  const parsed = parseResidentForm(formData);

  return {
    firstName: parsed.firstName,
    middleName: parsed.middleName,
    lastName: parsed.lastName,
    suffix: parsed.suffix,
    gender: parsed.gender,
    birthDate: parsed.birthDate,
    civilStatus: parsed.civilStatus,
    contactNumber: parsed.contactNumber,
    occupation: parsed.occupation,
    citizenship: parsed.citizenship,
    addressLine: parsed.address,
    addressBarangay: parsed.barangay,
    city: parsed.city,
    province: parsed.province,
    purok: parsed.purok,
    isActive: parsed.isActive,
  };
}

export async function createResident(formData: FormData) {
  const barangayId = await requireResidentBarangayId();
  const data = toResidentData(formData);

  const resident = await prisma.resident.create({
    data: {
      ...data,
      barangayId,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/residents");
  redirect(`/residents/${resident.id}?created=1`);
}

export async function updateResident(id: string, formData: FormData) {
  const barangayId = await requireResidentBarangayId();
  const data = toResidentData(formData);

  await prisma.resident.update({
    where: {
      id,
      barangayId,
    },
    data,
  });

  revalidatePath("/residents");
  revalidatePath(`/residents/${id}`);
  redirect(`/residents/${id}?updated=1`);
}

export async function softDeleteResident(formData: FormData) {
  const barangayId = await requireResidentBarangayId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Resident id is required.");
  }

  await prisma.resident.update({
    where: {
      id,
      barangayId,
    },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/residents");
  revalidatePath(`/residents/${id}`);
  redirect("/residents?deleted=1");
}
