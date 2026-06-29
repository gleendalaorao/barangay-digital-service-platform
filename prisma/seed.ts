import bcrypt from "bcrypt";
import {
  CertificateStatus,
  CertificateType,
  PrismaClient,
  PublicRequestStatus,
  ResidentAccountStatus,
  Role,
  SubscriptionStatus,
} from "@prisma/client";

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
    where: { slug: "san-isidro" },
    update: {
      name: "Barangay San Isidro",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      contactEmail: "office@sanisidro.local",
      contactNumber: "+63 917 555 0184",
    },
    create: {
      name: "Barangay San Isidro",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      slug: "san-isidro",
      contactEmail: "office@sanisidro.local",
      contactNumber: "+63 917 555 0184",
    },
  });

  await prisma.barangaySetting.upsert({
    where: { barangayId: barangay.id },
    update: {
      certificatePrefix: "SANISIDRO",
      officeAddress: "Barangay San Isidro Hall, Purok 2, Butuan City, Agusan del Norte",
      officeHours: "Monday to Friday, 8:00 AM to 5:00 PM",
      captainName: "Hon. Roberto D. Villanueva",
      secretaryName: "Maria Teresa A. Santos",
      treasurerName: "Elena P. Dela Cruz",
      officialHeaderLine1: "Republic of the Philippines",
      officialHeaderLine2: "City of Butuan, Province of Agusan del Norte",
      officialHeaderLine3: "Barangay San Isidro",
      releaseInstructions: "Approved documents are released at the barangay hall after identity verification.",
      certificateFooterNote: "This certificate is valid only for the purpose stated herein.",
      welcomeTitle: "Welcome to Barangay San Isidro",
      welcomeMessage:
        "Access barangay services online, check public announcements, and track document requests from home or at the barangay hall.",
      publicServiceTagline: "Fast, transparent, and resident-friendly barangay services.",
      primaryColor: "#047857",
      secondaryColor: "#0f766e",
      facebookPageUrl: "https://www.facebook.com/barangaysanisidro",
    },
    create: {
      barangayId: barangay.id,
      certificatePrefix: "SANISIDRO",
      officeAddress: "Barangay San Isidro Hall, Purok 2, Butuan City, Agusan del Norte",
      officeHours: "Monday to Friday, 8:00 AM to 5:00 PM",
      captainName: "Hon. Roberto D. Villanueva",
      secretaryName: "Maria Teresa A. Santos",
      treasurerName: "Elena P. Dela Cruz",
      officialHeaderLine1: "Republic of the Philippines",
      officialHeaderLine2: "City of Butuan, Province of Agusan del Norte",
      officialHeaderLine3: "Barangay San Isidro",
      releaseInstructions: "Approved documents are released at the barangay hall after identity verification.",
      certificateFooterNote: "This certificate is valid only for the purpose stated herein.",
      welcomeTitle: "Welcome to Barangay San Isidro",
      welcomeMessage:
        "Access barangay services online, check public announcements, and track document requests from home or at the barangay hall.",
      publicServiceTagline: "Fast, transparent, and resident-friendly barangay services.",
      primaryColor: "#047857",
      secondaryColor: "#0f766e",
      facebookPageUrl: "https://www.facebook.com/barangaysanisidro",
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

  const passwordHash = await bcrypt.hash("password123", 12);
  const userSeeds = [
    {
      name: "Platform Super Admin",
      email: "superadmin@barangay-platform.local",
      role: Role.SUPER_ADMIN,
      barangayId: null,
    },
    {
      name: "Alicia Reyes",
      email: "admin@sanisidro.local",
      role: Role.ADMIN,
      barangayId: barangay.id,
    },
    {
      name: "Maria Teresa Santos",
      email: "secretary@sanisidro.local",
      role: Role.SECRETARY,
      barangayId: barangay.id,
    },
    {
      name: "Roberto Villanueva",
      email: "captain@sanisidro.local",
      role: Role.CAPTAIN,
      barangayId: barangay.id,
    },
    {
      name: "Joel Mercado",
      email: "staff@sanisidro.local",
      role: Role.STAFF,
      barangayId: barangay.id,
    },
  ];

  const users = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();

  for (const user of userSeeds) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        isActive: true,
        barangayId: user.barangayId,
      },
      create: {
        ...user,
        passwordHash,
        isActive: true,
      },
    });

    users.set(user.email, savedUser);
  }

  const households = [
    {
      id: "seed-household-san-isidro-dela-cruz",
      householdNo: "SI-0001",
      addressLine: "Purok 1, San Isidro Riverside Road",
      purok: "Purok 1",
    },
    {
      id: "seed-household-san-isidro-garcia",
      householdNo: "SI-0002",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
    },
    {
      id: "seed-household-san-isidro-navarro",
      householdNo: "SI-0003",
      addressLine: "Purok 4, Narra Extension",
      purok: "Purok 4",
    },
  ];

  for (const household of households) {
    await prisma.household.upsert({
      where: {
        barangayId_householdNo: {
          barangayId: barangay.id,
          householdNo: household.householdNo,
        },
      },
      update: {
        addressLine: household.addressLine,
        addressBarangay: barangay.name,
        city: barangay.municipality,
        province: barangay.province,
        purok: household.purok,
        isActive: true,
      },
      create: {
        ...household,
        barangayId: barangay.id,
        addressBarangay: barangay.name,
        city: barangay.municipality,
        province: barangay.province,
        isActive: true,
      },
    });
  }

  const savedHouseholds = await prisma.household.findMany({
    where: { barangayId: barangay.id, householdNo: { in: households.map((household) => household.householdNo) } },
  });
  const householdByNo = new Map(savedHouseholds.map((household) => [household.householdNo, household]));

  const residents = [
    {
      id: "seed-resident-juan-dela-cruz",
      householdNo: "SI-0001",
      firstName: "Juan",
      middleName: "Reyes",
      lastName: "Dela Cruz",
      birthDate: new Date("1979-04-12"),
      gender: "Male",
      civilStatus: "Married",
      contactNumber: "+63 917 101 1001",
      occupation: "Tricycle Operator",
      addressLine: "Purok 1, San Isidro Riverside Road",
      purok: "Purok 1",
    },
    {
      id: "seed-resident-ana-dela-cruz",
      householdNo: "SI-0001",
      firstName: "Ana",
      middleName: "Mendoza",
      lastName: "Dela Cruz",
      birthDate: new Date("1982-09-21"),
      gender: "Female",
      civilStatus: "Married",
      contactNumber: "+63 917 101 1002",
      occupation: "Sari-sari Store Owner",
      addressLine: "Purok 1, San Isidro Riverside Road",
      purok: "Purok 1",
    },
    {
      id: "seed-resident-mikaela-dela-cruz",
      householdNo: "SI-0001",
      firstName: "Mikaela",
      middleName: "Mendoza",
      lastName: "Dela Cruz",
      birthDate: new Date("2007-06-03"),
      gender: "Female",
      civilStatus: "Single",
      contactNumber: "+63 917 101 1003",
      occupation: "Student",
      addressLine: "Purok 1, San Isidro Riverside Road",
      purok: "Purok 1",
    },
    {
      id: "seed-resident-pedro-garcia",
      householdNo: "SI-0002",
      firstName: "Pedro",
      middleName: "Flores",
      lastName: "Garcia",
      birthDate: new Date("1968-02-18"),
      gender: "Male",
      civilStatus: "Married",
      contactNumber: "+63 917 101 2001",
      occupation: "Farmer",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
    },
    {
      id: "seed-resident-lourdes-garcia",
      householdNo: "SI-0002",
      firstName: "Lourdes",
      middleName: "Aquino",
      lastName: "Garcia",
      birthDate: new Date("1971-11-08"),
      gender: "Female",
      civilStatus: "Married",
      contactNumber: "+63 917 101 2002",
      occupation: "Barangay Health Worker",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
    },
    {
      id: "seed-resident-carlo-garcia",
      householdNo: "SI-0002",
      firstName: "Carlo",
      middleName: "Aquino",
      lastName: "Garcia",
      birthDate: new Date("1998-01-29"),
      gender: "Male",
      civilStatus: "Single",
      contactNumber: "+63 917 101 2003",
      occupation: "Construction Worker",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
    },
    {
      id: "seed-resident-rosalie-navarro",
      householdNo: "SI-0003",
      firstName: "Rosalie",
      middleName: "Cabrera",
      lastName: "Navarro",
      birthDate: new Date("1987-12-14"),
      gender: "Female",
      civilStatus: "Widowed",
      contactNumber: "+63 917 101 3001",
      occupation: "Public School Teacher",
      addressLine: "Purok 4, Narra Extension",
      purok: "Purok 4",
    },
    {
      id: "seed-resident-mark-navarro",
      householdNo: "SI-0003",
      firstName: "Mark",
      middleName: "Cabrera",
      lastName: "Navarro",
      birthDate: new Date("2004-05-19"),
      gender: "Male",
      civilStatus: "Single",
      contactNumber: "+63 917 101 3002",
      occupation: "College Student",
      addressLine: "Purok 4, Narra Extension",
      purok: "Purok 4",
    },
    {
      id: "seed-resident-elena-santos",
      householdNo: "SI-0003",
      firstName: "Elena",
      middleName: "Padilla",
      lastName: "Santos",
      birthDate: new Date("1959-07-07"),
      gender: "Female",
      civilStatus: "Separated",
      contactNumber: "+63 917 101 3003",
      occupation: "Retired Vendor",
      addressLine: "Purok 4, Narra Extension",
      purok: "Purok 4",
    },
    {
      id: "seed-resident-antonio-ramos",
      householdNo: "SI-0002",
      firstName: "Antonio",
      middleName: "Lim",
      lastName: "Ramos",
      birthDate: new Date("1991-10-25"),
      gender: "Male",
      civilStatus: "Single",
      contactNumber: "+63 917 101 2004",
      occupation: "Motorcycle Mechanic",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
    },
  ];

  for (const resident of residents) {
    const household = householdByNo.get(resident.householdNo);

    await prisma.resident.upsert({
      where: { id: resident.id },
      update: {
        barangayId: barangay.id,
        householdId: household?.id,
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        birthDate: resident.birthDate,
        gender: resident.gender,
        civilStatus: resident.civilStatus,
        contactNumber: resident.contactNumber,
        occupation: resident.occupation,
        citizenship: "Filipino",
        addressLine: resident.addressLine,
        addressBarangay: barangay.name,
        city: barangay.municipality,
        province: barangay.province,
        purok: resident.purok,
        isActive: true,
      },
      create: {
        id: resident.id,
        barangayId: barangay.id,
        householdId: household?.id,
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        birthDate: resident.birthDate,
        gender: resident.gender,
        civilStatus: resident.civilStatus,
        contactNumber: resident.contactNumber,
        occupation: resident.occupation,
        citizenship: "Filipino",
        addressLine: resident.addressLine,
        addressBarangay: barangay.name,
        city: barangay.municipality,
        province: barangay.province,
        purok: resident.purok,
        isActive: true,
      },
    });
  }

  await prisma.household.update({
    where: { barangayId_householdNo: { barangayId: barangay.id, householdNo: "SI-0001" } },
    data: { headResidentId: "seed-resident-juan-dela-cruz" },
  });
  await prisma.household.update({
    where: { barangayId_householdNo: { barangayId: barangay.id, householdNo: "SI-0002" } },
    data: { headResidentId: "seed-resident-pedro-garcia" },
  });
  await prisma.household.update({
    where: { barangayId_householdNo: { barangayId: barangay.id, householdNo: "SI-0003" } },
    data: { headResidentId: "seed-resident-rosalie-navarro" },
  });

  const secretary = users.get("secretary@sanisidro.local");
  const captain = users.get("captain@sanisidro.local");
  const staff = users.get("staff@sanisidro.local");
  const admin = users.get("admin@sanisidro.local");

  const certificates = [
    {
      controlNumber: "SANISIDRO-2026-0001",
      residentId: "seed-resident-mikaela-dela-cruz",
      requestedById: secretary?.id,
      approvedById: null,
      certificateType: CertificateType.BARANGAY_CLEARANCE,
      status: CertificateStatus.DRAFT,
      purpose: "School scholarship application",
      remarks: "Draft prepared for resident verification.",
      issuedAt: null,
      releasedAt: null,
    },
    {
      controlNumber: "SANISIDRO-2026-0002",
      residentId: "seed-resident-carlo-garcia",
      requestedById: staff?.id,
      approvedById: null,
      certificateType: CertificateType.RESIDENCY,
      status: CertificateStatus.PENDING_APPROVAL,
      purpose: "Employment requirement",
      remarks: "Awaiting captain approval.",
      issuedAt: null,
      releasedAt: null,
    },
    {
      controlNumber: "SANISIDRO-2026-0003",
      residentId: "seed-resident-elena-santos",
      requestedById: secretary?.id,
      approvedById: captain?.id,
      certificateType: CertificateType.INDIGENCY,
      status: CertificateStatus.APPROVED,
      purpose: "Medical assistance application",
      remarks: "Approved for release.",
      issuedAt: new Date("2026-06-20T09:30:00+08:00"),
      releasedAt: null,
    },
    {
      controlNumber: "SANISIDRO-2026-0004",
      residentId: "seed-resident-juan-dela-cruz",
      requestedById: secretary?.id,
      approvedById: captain?.id,
      certificateType: CertificateType.BARANGAY_CLEARANCE,
      status: CertificateStatus.RELEASED,
      purpose: "Business permit renewal",
      remarks: "Released to requesting resident.",
      issuedAt: new Date("2026-06-18T10:15:00+08:00"),
      releasedAt: new Date("2026-06-18T15:40:00+08:00"),
    },
  ];

  for (const certificate of certificates) {
    await prisma.certificateRequest.upsert({
      where: {
        barangayId_controlNumber: {
          barangayId: barangay.id,
          controlNumber: certificate.controlNumber,
        },
      },
      update: certificate,
      create: {
        ...certificate,
        barangayId: barangay.id,
      },
    });
  }

  const publicRequests = [
    {
      trackingCode: "SI-PUB-2026-0001",
      residentId: "seed-resident-ana-dela-cruz",
      firstName: "Ana",
      middleName: "Mendoza",
      lastName: "Dela Cruz",
      birthDate: new Date("1982-09-21"),
      requesterName: "Ana M. Dela Cruz",
      requesterEmail: "ana.delacruz@example.local",
      requesterMobile: "+63 917 101 1002",
      certificateType: CertificateType.RESIDENCY,
      status: PublicRequestStatus.SUBMITTED,
      purpose: "Proof of residence for utility account update",
      addressLine: "Purok 1, San Isidro Riverside Road",
      purok: "Purok 1",
      notes: "Submitted through the public request portal.",
      reviewedAt: null,
      completedAt: null,
    },
    {
      trackingCode: "SI-PUB-2026-0002",
      residentId: "seed-resident-mark-navarro",
      firstName: "Mark",
      middleName: "Cabrera",
      lastName: "Navarro",
      birthDate: new Date("2004-05-19"),
      requesterName: "Mark C. Navarro",
      requesterEmail: "mark.navarro@example.local",
      requesterMobile: "+63 917 101 3002",
      certificateType: CertificateType.BARANGAY_CLEARANCE,
      status: PublicRequestStatus.UNDER_REVIEW,
      purpose: "Internship requirement",
      addressLine: "Purok 4, Narra Extension",
      purok: "Purok 4",
      notes: "Validating resident profile and purpose.",
      reviewedAt: new Date("2026-06-23T11:00:00+08:00"),
      completedAt: null,
    },
    {
      trackingCode: "SI-PUB-2026-0003",
      residentId: "seed-resident-lourdes-garcia",
      firstName: "Lourdes",
      middleName: "Aquino",
      lastName: "Garcia",
      birthDate: new Date("1971-11-08"),
      requesterName: "Lourdes A. Garcia",
      requesterEmail: "lourdes.garcia@example.local",
      requesterMobile: "+63 917 101 2002",
      certificateType: CertificateType.INDIGENCY,
      status: PublicRequestStatus.READY_FOR_PICKUP,
      purpose: "PhilHealth assistance",
      addressLine: "Purok 2, Maharlika Street",
      purok: "Purok 2",
      notes: "Ready for pickup at the barangay hall.",
      reviewedAt: new Date("2026-06-21T14:20:00+08:00"),
      completedAt: new Date("2026-06-22T09:10:00+08:00"),
    },
  ];

  for (const publicRequest of publicRequests) {
    await prisma.publicDocumentRequest.upsert({
      where: { trackingCode: publicRequest.trackingCode },
      update: {
        ...publicRequest,
        barangayId: barangay.id,
      },
      create: {
        ...publicRequest,
        barangayId: barangay.id,
      },
    });
  }

  await prisma.residentAccount.upsert({
    where: {
      barangayId_email: {
        barangayId: barangay.id,
        email: "rosa.malinao@example.local",
      },
    },
    update: {
      firstName: "Rosa",
      middleName: "Lim",
      lastName: "Malinao",
      suffix: null,
      birthDate: new Date("1997-09-14T00:00:00+08:00"),
      gender: "Female",
      contactNumber: "+63 917 101 4001",
      passwordHash,
      addressLine: "Purok 3, San Isidro National Road",
      purok: "Purok 3",
      status: ResidentAccountStatus.PENDING_VERIFICATION,
      residentId: null,
      verifiedAt: null,
    },
    create: {
      id: "seed-resident-account-rosa-malinao",
      barangayId: barangay.id,
      firstName: "Rosa",
      middleName: "Lim",
      lastName: "Malinao",
      suffix: null,
      birthDate: new Date("1997-09-14T00:00:00+08:00"),
      gender: "Female",
      contactNumber: "+63 917 101 4001",
      email: "rosa.malinao@example.local",
      passwordHash,
      addressLine: "Purok 3, San Isidro National Road",
      purok: "Purok 3",
      status: ResidentAccountStatus.PENDING_VERIFICATION,
    },
  });

  await prisma.residentVerificationRequest.upsert({
    where: { id: "seed-verification-rosa-malinao" },
    update: {
      barangayId: barangay.id,
      accountId: "seed-resident-account-rosa-malinao",
      residentId: null,
      status: ResidentAccountStatus.PENDING_VERIFICATION,
      purpose: "Online account registration for requesting barangay certificates.",
      staffNotes: null,
      reviewedById: null,
      reviewedAt: null,
    },
    create: {
      id: "seed-verification-rosa-malinao",
      barangayId: barangay.id,
      accountId: "seed-resident-account-rosa-malinao",
      status: ResidentAccountStatus.PENDING_VERIFICATION,
      purpose: "Online account registration for requesting barangay certificates.",
    },
  });

  const announcements = [
    {
      id: "seed-announcement-san-isidro-cleanup",
      title: "Community Clean-Up Drive",
      body: "Barangay San Isidro invites all residents to join the clean-up drive this Saturday, 7:00 AM, starting at the barangay hall.",
      category: "Community",
      isPublished: true,
      publishedAt: new Date("2026-06-15T08:00:00+08:00"),
      createdById: secretary?.id,
    },
    {
      id: "seed-announcement-san-isidro-medical",
      title: "Free Blood Pressure and Glucose Screening",
      body: "Free basic health screening will be available at the covered court on June 30 from 9:00 AM to 3:00 PM.",
      category: "Health",
      isPublished: true,
      publishedAt: new Date("2026-06-24T10:00:00+08:00"),
      createdById: admin?.id,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { id: announcement.id },
      update: {
        barangayId: barangay.id,
        title: announcement.title,
        body: announcement.body,
        category: announcement.category,
        isPublished: announcement.isPublished,
        publishedAt: announcement.publishedAt,
        createdById: announcement.createdById,
      },
      create: {
        ...announcement,
        barangayId: barangay.id,
      },
    });
  }

  const officials = [
    {
      id: "seed-official-san-isidro-captain",
      name: "Hon. Roberto D. Villanueva",
      position: "Barangay Captain",
      contact: "+63 917 555 0184",
      displayOrder: 1,
    },
    {
      id: "seed-official-san-isidro-secretary",
      name: "Maria Teresa A. Santos",
      position: "Barangay Secretary",
      contact: "office@sanisidro.local",
      displayOrder: 2,
    },
    {
      id: "seed-official-san-isidro-treasurer",
      name: "Elena P. Dela Cruz",
      position: "Barangay Treasurer",
      contact: "+63 917 555 0185",
      displayOrder: 3,
    },
  ];

  for (const official of officials) {
    await prisma.publicOfficial.upsert({
      where: { id: official.id },
      update: {
        barangayId: barangay.id,
        name: official.name,
        position: official.position,
        contact: official.contact,
        displayOrder: official.displayOrder,
        isPublished: true,
      },
      create: {
        ...official,
        barangayId: barangay.id,
        isPublished: true,
      },
    });
  }

  const services = [
    {
      id: "seed-service-san-isidro-clearance",
      name: "Barangay Clearance",
      description: "Certificate for employment, business permit renewal, internship, or other official requirements.",
      requirements: "Valid ID; purpose of request; updated resident profile",
      processingTime: "Same day if records are complete",
      feeText: "Please confirm applicable fees at the barangay hall.",
      requestLink: `/b/${barangay.slug}/request`,
      displayOrder: 1,
    },
    {
      id: "seed-service-san-isidro-residency",
      name: "Certificate of Residency",
      description: "Proof that a resident currently lives in Barangay San Isidro.",
      requirements: "Valid ID; current address; purok information",
      processingTime: "Same day review",
      feeText: "Free for most public service requirements.",
      requestLink: `/b/${barangay.slug}/request`,
      displayOrder: 2,
    },
    {
      id: "seed-service-san-isidro-indigency",
      name: "Certificate of Indigency",
      description: "Supporting document for medical, educational, and social assistance applications.",
      requirements: "Valid ID; statement of purpose; household information",
      processingTime: "1 working day",
      feeText: "No fee",
      requestLink: `/b/${barangay.slug}/request`,
      displayOrder: 3,
    },
  ];

  for (const service of services) {
    await prisma.publicService.upsert({
      where: { id: service.id },
      update: {
        barangayId: barangay.id,
        name: service.name,
        description: service.description,
        requirements: service.requirements,
        processingTime: service.processingTime,
        feeText: service.feeText,
        requestLink: service.requestLink,
        displayOrder: service.displayOrder,
        isPublished: true,
      },
      create: {
        ...service,
        barangayId: barangay.id,
        isPublished: true,
      },
    });
  }

  const auditLogs = [
    {
      id: "seed-audit-san-isidro-user-login",
      userId: admin?.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: admin?.id,
      metadata: { email: "admin@sanisidro.local", result: "success" },
    },
    {
      id: "seed-audit-san-isidro-resident-created",
      userId: secretary?.id,
      action: "RESIDENT_CREATED",
      entity: "Resident",
      entityId: "seed-resident-juan-dela-cruz",
      metadata: { residentName: "Juan Dela Cruz", source: "seed" },
    },
    {
      id: "seed-audit-san-isidro-certificate-approved",
      userId: captain?.id,
      action: "CERTIFICATE_APPROVED",
      entity: "CertificateRequest",
      entityId: "SANISIDRO-2026-0003",
      metadata: { controlNumber: "SANISIDRO-2026-0003", status: CertificateStatus.APPROVED },
    },
    {
      id: "seed-audit-san-isidro-public-request-reviewed",
      userId: staff?.id,
      action: "PUBLIC_REQUEST_REVIEWED",
      entity: "PublicDocumentRequest",
      entityId: "SI-PUB-2026-0002",
      metadata: { trackingCode: "SI-PUB-2026-0002", status: PublicRequestStatus.UNDER_REVIEW },
    },
  ];

  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: {
        barangayId: barangay.id,
        userId: auditLog.userId,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        metadata: auditLog.metadata,
        ipAddress: "127.0.0.1",
        userAgent: "Prisma seed",
      },
      create: {
        ...auditLog,
        barangayId: barangay.id,
        ipAddress: "127.0.0.1",
        userAgent: "Prisma seed",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
