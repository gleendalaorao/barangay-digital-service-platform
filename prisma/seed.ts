import bcrypt from "bcrypt";
import { PrismaClient, Role, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: "FREE",
      name: "Free",
      description: "Evaluation plan for small barangay teams.",
      monthlyPrice: "0.00",
      maxUsers: 2,
      maxResidents: 500,
    },
    {
      code: "BASIC",
      name: "Basic",
      description: "Core digital services for daily barangay operations.",
      monthlyPrice: "1499.00",
      maxUsers: 8,
      maxResidents: 10000,
    },
    {
      code: "PRO",
      name: "Pro",
      description: "Expanded capacity for high-volume barangay offices.",
      monthlyPrice: "2999.00",
      maxUsers: null,
      maxResidents: null,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  const freePlan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { code: "FREE" },
  });

  const barangay = await prisma.barangay.upsert({
    where: { slug: "sample-barangay" },
    update: {},
    create: {
      name: "Sample Barangay",
      municipality: "Quezon City",
      province: "Metro Manila",
      region: "NCR",
      slug: "sample-barangay",
      contactEmail: "office@sample-barangay.local",
      contactNumber: "+639171234567",
    },
  });

  await prisma.barangaySetting.upsert({
    where: { barangayId: barangay.id },
    update: {},
    create: {
      barangayId: barangay.id,
      certificatePrefix: "SB",
      officeAddress: "Sample Barangay Hall, Quezon City",
      officeHours: "Monday to Friday, 8:00 AM to 5:00 PM",
      releaseInstructions: "Approved documents are released at the barangay hall after identity verification.",
    },
  });

  await prisma.subscription.upsert({
    where: {
      id: "seed-sample-subscription",
    },
    update: {
      barangayId: barangay.id,
      planId: freePlan.id,
      status: SubscriptionStatus.TRIAL,
    },
    create: {
      id: "seed-sample-subscription",
      barangayId: barangay.id,
      planId: freePlan.id,
      status: SubscriptionStatus.TRIAL,
    },
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { email: "superadmin@barangay-platform.local" },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      barangayId: null,
    },
    create: {
      name: "Platform Super Admin",
      email: "superadmin@barangay-platform.local",
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sample-barangay.local" },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      barangayId: barangay.id,
    },
    create: {
      name: "Sample Barangay Admin",
      email: "admin@sample-barangay.local",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      barangayId: barangay.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
