"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { requireBackupAdminSession } from "@/lib/backup/access";
import { restoreBackup } from "@/lib/backup/restore";

export async function restoreBackupAction(formData: FormData) {
  const session = await requireBackupAdminSession();
  const file = formData.get("backupFile");
  const confirmation = formData.get("confirmRestore");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Upload a backup JSON file.");
  }

  if (confirmation !== "on") {
    throw new Error("Confirm that you understand restore will replace tenant data.");
  }

  const rawJson = await file.text();
  const backup = await restoreBackup({
    barangayId: session.barangayId,
    rawJson,
  });

  await logAuditEvent({
    barangayId: session.barangayId,
    userId: session.userId,
    action: "BACKUP_RESTORED",
    entity: "Backup",
    entityId: file.name,
    description: `Restored backup package ${file.name}.`,
    metadata: {
      filename: file.name,
      backupGeneratedAt: backup.generatedAt,
      schemaVersion: backup.schemaVersion,
    },
  });

  revalidatePath("/");
  revalidatePath("/residents");
  revalidatePath("/households");
  revalidatePath("/certificates");
  revalidatePath("/requests");
  revalidatePath("/announcements");
  revalidatePath("/settings/backup");
  redirect("/settings/backup?restored=1");
}
