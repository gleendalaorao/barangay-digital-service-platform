import { CertificateStatus, CertificateType, PublicRequestStatus, Role } from "@prisma/client";
import { parseBackupPackage, type BackupPackage } from "@/lib/backup/package";
import { prisma } from "@/lib/prisma";

type RestoreInput = {
  barangayId: string;
  rawJson: string;
};

export async function restoreBackup({ barangayId, rawJson }: RestoreInput) {
  const parsedJson = JSON.parse(rawJson) as unknown;
  const backup = parseBackupPackage(parsedJson);
  const currentBarangay = await prisma.barangay.findUniqueOrThrow({
    where: { id: barangayId },
    select: { id: true, slug: true, name: true },
  });

  if (backup.barangay.id !== currentBarangay.id && backup.barangay.slug !== currentBarangay.slug) {
    throw new Error("This backup belongs to a different barangay tenant.");
  }

  const validatedEnums = validateBackupEnums(backup);

  await prisma.$transaction(async (tx) => {
    const existingUsers = await tx.user.findMany({
      where: { barangayId },
      select: { id: true },
    });
    const userIds = new Set(existingUsers.map((user) => user.id));

    await tx.certificateRequest.deleteMany({ where: { barangayId } });
    await tx.publicDocumentRequest.deleteMany({ where: { barangayId } });
    await tx.announcement.deleteMany({ where: { barangayId } });
    await tx.household.deleteMany({ where: { barangayId } });
    await tx.resident.deleteMany({ where: { barangayId } });

    await tx.barangay.update({
      where: { id: barangayId },
      data: {
        name: backup.barangay.name,
        municipality: backup.barangay.municipality,
        province: backup.barangay.province,
        region: backup.barangay.region,
        contactEmail: backup.barangay.contactEmail,
        contactNumber: backup.barangay.contactNumber,
      },
    });

    if (isObject(backup.data.settings)) {
      const settings = backup.data.settings;

      await tx.barangaySetting.upsert({
        where: { barangayId },
        update: settingData(settings),
        create: {
          ...settingData(settings),
          barangayId,
        },
      });
    }

    for (const [index, user] of backup.data.users.entries()) {
      if (!isObject(user) || typeof user.email !== "string") {
        continue;
      }

      await tx.user.updateMany({
        where: { barangayId, email: user.email },
        data: {
          name: stringValue(user.name) ?? user.email,
          role: validatedEnums.userRoles[index],
          isActive: booleanValue(user.isActive) ?? true,
          image: nullableStringValue(user.image),
        },
      });
    }

    for (const resident of backup.data.residents) {
      await tx.resident.create({
        data: {
          id: stringValue(resident.id),
          barangayId,
          firstName: stringValue(resident.firstName) ?? "",
          middleName: nullableStringValue(resident.middleName),
          lastName: stringValue(resident.lastName) ?? "",
          suffix: nullableStringValue(resident.suffix),
          birthDate: nullableDateValue(resident.birthDate),
          gender: nullableStringValue(resident.gender),
          civilStatus: nullableStringValue(resident.civilStatus),
          contactNumber: nullableStringValue(resident.contactNumber),
          occupation: nullableStringValue(resident.occupation),
          citizenship: stringValue(resident.citizenship) ?? "Filipino",
          addressLine: stringValue(resident.addressLine) ?? "",
          addressBarangay: nullableStringValue(resident.addressBarangay),
          city: nullableStringValue(resident.city),
          province: nullableStringValue(resident.province),
          purok: nullableStringValue(resident.purok),
          isActive: booleanValue(resident.isActive) ?? true,
          createdAt: dateValue(resident.createdAt),
          updatedAt: dateValue(resident.updatedAt),
        },
      });
    }

    const residentIds = new Set(
      (
        await tx.resident.findMany({
          where: { barangayId },
          select: { id: true },
        })
      ).map((resident) => resident.id),
    );

    for (const household of backup.data.households) {
      const headResidentId = nullableStringValue(household.headResidentId);

      await tx.household.create({
        data: {
          id: stringValue(household.id),
          barangayId,
          headResidentId: headResidentId && residentIds.has(headResidentId) ? headResidentId : null,
          householdNo: stringValue(household.householdNo) ?? "",
          addressLine: stringValue(household.addressLine) ?? "",
          addressBarangay: nullableStringValue(household.addressBarangay),
          city: nullableStringValue(household.city),
          province: nullableStringValue(household.province),
          purok: nullableStringValue(household.purok),
          isActive: booleanValue(household.isActive) ?? true,
          createdAt: dateValue(household.createdAt),
          updatedAt: dateValue(household.updatedAt),
        },
      });
    }

    const householdIds = new Set(
      (
        await tx.household.findMany({
          where: { barangayId },
          select: { id: true },
        })
      ).map((household) => household.id),
    );

    for (const resident of backup.data.residents) {
      const residentId = stringValue(resident.id);
      const householdId = nullableStringValue(resident.householdId);

      if (residentId && householdId && householdIds.has(householdId)) {
        await tx.resident.update({
          where: { id: residentId },
          data: { householdId },
        });
      }
    }

    for (const [index, certificate] of backup.data.certificates.entries()) {
      const residentId = nullableStringValue(certificate.residentId);
      const requestedById = nullableStringValue(certificate.requestedById);
      const approvedById = nullableStringValue(certificate.approvedById);

      await tx.certificateRequest.create({
        data: {
          id: stringValue(certificate.id),
          barangayId,
          residentId: residentId && residentIds.has(residentId) ? residentId : null,
          requestedById: requestedById && userIds.has(requestedById) ? requestedById : null,
          approvedById: approvedById && userIds.has(approvedById) ? approvedById : null,
          certificateType: validatedEnums.certificateTypes[index],
          status: validatedEnums.certificateStatuses[index],
          purpose: nullableStringValue(certificate.purpose),
          remarks: nullableStringValue(certificate.remarks),
          controlNumber: nullableStringValue(certificate.controlNumber),
          issuedAt: nullableDateValue(certificate.issuedAt),
          releasedAt: nullableDateValue(certificate.releasedAt),
          createdAt: dateValue(certificate.createdAt),
          updatedAt: dateValue(certificate.updatedAt),
        },
      });
    }

    for (const [index, request] of backup.data.publicRequests.entries()) {
      const residentId = nullableStringValue(request.residentId);

      await tx.publicDocumentRequest.create({
        data: {
          id: stringValue(request.id),
          barangayId,
          residentId: residentId && residentIds.has(residentId) ? residentId : null,
          firstName: stringValue(request.firstName) ?? "",
          middleName: nullableStringValue(request.middleName),
          lastName: stringValue(request.lastName) ?? "",
          suffix: nullableStringValue(request.suffix),
          birthDate: nullableDateValue(request.birthDate),
          requesterName: stringValue(request.requesterName) ?? "",
          requesterEmail: nullableStringValue(request.requesterEmail),
          requesterMobile: stringValue(request.requesterMobile) ?? "",
          certificateType: validatedEnums.publicRequestCertificateTypes[index],
          status: validatedEnums.publicRequestStatuses[index],
          purpose: nullableStringValue(request.purpose),
          addressLine: stringValue(request.addressLine) ?? "",
          purok: nullableStringValue(request.purok),
          notes: nullableStringValue(request.notes),
          trackingCode: stringValue(request.trackingCode) ?? "",
          submittedAt: dateValue(request.submittedAt),
          reviewedAt: nullableDateValue(request.reviewedAt),
          completedAt: nullableDateValue(request.completedAt),
          createdAt: dateValue(request.createdAt),
          updatedAt: dateValue(request.updatedAt),
        },
      });
    }

    for (const announcement of backup.data.announcements) {
      const createdById = nullableStringValue(announcement.createdById);

      await tx.announcement.create({
        data: {
          id: stringValue(announcement.id),
          barangayId,
          title: stringValue(announcement.title) ?? "",
          body: stringValue(announcement.body) ?? "",
          category: nullableStringValue(announcement.category),
          isPublished: booleanValue(announcement.isPublished) ?? false,
          publishedAt: nullableDateValue(announcement.publishedAt),
          createdById: createdById && userIds.has(createdById) ? createdById : null,
          createdAt: dateValue(announcement.createdAt),
          updatedAt: dateValue(announcement.updatedAt),
        },
      });
    }
  });

  return backup;
}

function settingData(settings: Record<string, unknown>) {
  return {
    certificatePrefix: stringValue(settings.certificatePrefix) ?? "BRGY",
    releaseInstructions: nullableStringValue(settings.releaseInstructions),
    officeAddress: nullableStringValue(settings.officeAddress),
    officeHours: nullableStringValue(settings.officeHours),
    captainName: nullableStringValue(settings.captainName),
    secretaryName: nullableStringValue(settings.secretaryName),
    treasurerName: nullableStringValue(settings.treasurerName),
    skChairpersonName: nullableStringValue(settings.skChairpersonName),
    officialHeaderLine1: nullableStringValue(settings.officialHeaderLine1),
    officialHeaderLine2: nullableStringValue(settings.officialHeaderLine2),
    officialHeaderLine3: nullableStringValue(settings.officialHeaderLine3),
    certificateFooterNote: nullableStringValue(settings.certificateFooterNote),
    logoUrl: nullableStringValue(settings.logoUrl),
    sealUrl: nullableStringValue(settings.sealUrl),
    createdAt: dateValue(settings.createdAt),
    updatedAt: dateValue(settings.updatedAt),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function nullableStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function validateBackupEnums(backup: BackupPackage) {
  return {
    userRoles: backup.data.users.map((user, index) =>
      validateEnumValue(isObject(user) ? user.role : undefined, Role, `users[${index}].role`),
    ),
    certificateTypes: backup.data.certificates.map((certificate, index) =>
      validateEnumValue(certificate.certificateType, CertificateType, `certificates[${index}].certificateType`),
    ),
    certificateStatuses: backup.data.certificates.map((certificate, index) =>
      validateEnumValue(certificate.status, CertificateStatus, `certificates[${index}].status`),
    ),
    publicRequestCertificateTypes: backup.data.publicRequests.map((request, index) =>
      validateEnumValue(request.certificateType, CertificateType, `publicRequests[${index}].certificateType`),
    ),
    publicRequestStatuses: backup.data.publicRequests.map((request, index) =>
      validateEnumValue(request.status, PublicRequestStatus, `publicRequests[${index}].status`),
    ),
  };
}

function validateEnumValue<T extends string>(
  value: unknown,
  enumObject: Record<string, T>,
  fieldPath: string,
): T {
  const expectedValues = Object.values(enumObject);

  if (typeof value === "string" && expectedValues.includes(value as T)) {
    return value as T;
  }

  const rejectedValue = JSON.stringify(value) ?? String(value);
  throw new Error(
    `Invalid backup enum at ${fieldPath}: ${rejectedValue}. Expected one of: ${expectedValues.join(", ")}.`,
  );
}

function nullableDateValue(value: unknown) {
  return typeof value === "string" || value instanceof Date ? new Date(value) : null;
}

function dateValue(value: unknown) {
  return nullableDateValue(value) ?? new Date();
}
