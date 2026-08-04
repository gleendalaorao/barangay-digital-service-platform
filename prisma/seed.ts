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

  await seedHolyRedeemer(freePlan.id, passwordHash);
  await seedBuhangin(freePlan.id, passwordHash);
}

async function seedHolyRedeemer(freePlanId: string, passwordHash: string) {
  const barangay = await prisma.barangay.upsert({
    where: { slug: "holy-redeemer" },
    update: {
      name: "Barangay Holy Redeemer",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      contactEmail: "office@holyredeemer.local",
      contactNumber: "+63 917 555 0276",
    },
    create: {
      name: "Barangay Holy Redeemer",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      slug: "holy-redeemer",
      contactEmail: "office@holyredeemer.local",
      contactNumber: "+63 917 555 0276",
    },
  });

  const settings = {
    certificatePrefix: "HOLYREDEEMER",
    officeAddress: "Barangay Holy Redeemer Hall, Purok 3, Butuan City, Agusan del Norte",
    officeHours: "Monday to Friday, 8:00 AM to 5:00 PM",
    captainName: "Hon. Daniel M. Cabahug",
    secretaryName: "Lorna V. Ecleo",
    treasurerName: "Rebecca S. Amora",
    skChairpersonName: "Miguel A. Corvera",
    officialHeaderLine1: "Republic of the Philippines",
    officialHeaderLine2: "City of Butuan, Province of Agusan del Norte",
    officialHeaderLine3: "Barangay Holy Redeemer",
    releaseInstructions: "Approved documents may be claimed at the barangay hall upon presentation of a valid ID and tracking or control number.",
    certificateFooterNote: "This document is valid only for the purpose stated and is subject to verification.",
    logoUrl: null,
    sealUrl: null,
    welcomeTitle: "Welcome to Barangay Holy Redeemer",
    welcomeMessage: "Request barangay documents, follow community announcements, and access resident services online.",
    publicServiceTagline: "Accessible, dependable, and community-centered public service.",
    primaryColor: "#1d4ed8",
    secondaryColor: "#0f766e",
    facebookPageUrl: "https://www.facebook.com/barangayholyredeemer",
  };

  await prisma.barangaySetting.upsert({
    where: { barangayId: barangay.id },
    update: settings,
    create: { barangayId: barangay.id, ...settings },
  });

  await prisma.subscription.upsert({
    where: { id: "seed-holy-redeemer-subscription" },
    update: { barangayId: barangay.id, planId: freePlanId, status: SubscriptionStatus.TRIAL },
    create: { id: "seed-holy-redeemer-subscription", barangayId: barangay.id, planId: freePlanId, status: SubscriptionStatus.TRIAL },
  });

  const userSeeds = [
    { name: "Clarissa M. Abellanosa", email: "admin@holyredeemer.local", role: Role.ADMIN },
    { name: "Lorna V. Ecleo", email: "secretary@holyredeemer.local", role: Role.SECRETARY },
    { name: "Daniel M. Cabahug", email: "captain@holyredeemer.local", role: Role.CAPTAIN },
    { name: "Kevin R. Maturan", email: "staff@holyredeemer.local", role: Role.STAFF },
  ];
  const users = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();

  for (const user of userSeeds) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash, isActive: true, barangayId: barangay.id },
      create: { ...user, passwordHash, isActive: true, barangayId: barangay.id },
    });
    users.set(user.email, savedUser);
  }

  const households = [
    { id: "seed-household-holy-redeemer-aquino", householdNo: "HR-0001", addressLine: "Purok 1, Mabini Street", purok: "Purok 1" },
    { id: "seed-household-holy-redeemer-bautista", householdNo: "HR-0002", addressLine: "Purok 2, Acacia Road", purok: "Purok 2" },
    { id: "seed-household-holy-redeemer-canete", householdNo: "HR-0003", addressLine: "Purok 3, Narra Avenue", purok: "Purok 3" },
    { id: "seed-household-holy-redeemer-lumapas", householdNo: "HR-0004", addressLine: "Purok 4, Riverside Drive", purok: "Purok 4" },
    { id: "seed-household-holy-redeemer-montenegro", householdNo: "HR-0005", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5" },
  ];

  for (const household of households) {
    await prisma.household.upsert({
      where: { barangayId_householdNo: { barangayId: barangay.id, householdNo: household.householdNo } },
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
    { id: "seed-resident-hr-ramon-aquino", householdNo: "HR-0001", firstName: "Ramon", middleName: "Garcia", lastName: "Aquino", birthDate: "1975-03-18", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 202 1001", occupation: "Delivery Driver", addressLine: "Purok 1, Mabini Street", purok: "Purok 1" },
    { id: "seed-resident-hr-liza-aquino", householdNo: "HR-0001", firstName: "Liza", middleName: "Perez", lastName: "Aquino", birthDate: "1978-08-09", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 202 1002", occupation: "Food Vendor", addressLine: "Purok 1, Mabini Street", purok: "Purok 1" },
    { id: "seed-resident-hr-camille-aquino", householdNo: "HR-0001", firstName: "Camille", middleName: "Perez", lastName: "Aquino", birthDate: "2005-11-24", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 202 1003", occupation: "College Student", addressLine: "Purok 1, Mabini Street", purok: "Purok 1" },
    { id: "seed-resident-hr-ernesto-bautista", householdNo: "HR-0002", firstName: "Ernesto", middleName: "Lopez", lastName: "Bautista", birthDate: "1958-01-30", gender: "Male", civilStatus: "Widowed", contactNumber: "+63 917 202 2001", occupation: "Retired Carpenter", addressLine: "Purok 2, Acacia Road", purok: "Purok 2" },
    { id: "seed-resident-hr-grace-bautista", householdNo: "HR-0002", firstName: "Grace", middleName: "Lopez", lastName: "Bautista", birthDate: "1986-06-12", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 202 2002", occupation: "Community Health Nurse", addressLine: "Purok 2, Acacia Road", purok: "Purok 2" },
    { id: "seed-resident-hr-mario-canete", householdNo: "HR-0003", firstName: "Mario", middleName: "Diaz", lastName: "Canete", birthDate: "1989-02-14", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 202 3001", occupation: "Electrician", addressLine: "Purok 3, Narra Avenue", purok: "Purok 3" },
    { id: "seed-resident-hr-jessa-canete", householdNo: "HR-0003", firstName: "Jessa", middleName: "Rivera", lastName: "Canete", birthDate: "1991-10-07", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 202 3002", occupation: "Elementary School Teacher", addressLine: "Purok 3, Narra Avenue", purok: "Purok 3" },
    { id: "seed-resident-hr-paulo-canete", householdNo: "HR-0003", firstName: "Paulo", middleName: "Rivera", lastName: "Canete", birthDate: "2013-04-22", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 202 3003", occupation: "Student", addressLine: "Purok 3, Narra Avenue", purok: "Purok 3" },
    { id: "seed-resident-hr-teresa-lumapas", householdNo: "HR-0004", firstName: "Teresa", middleName: "Velasco", lastName: "Lumapas", birthDate: "1966-09-03", gender: "Female", civilStatus: "Separated", contactNumber: "+63 917 202 4001", occupation: "Market Vendor", addressLine: "Purok 4, Riverside Drive", purok: "Purok 4" },
    { id: "seed-resident-hr-nicole-lumapas", householdNo: "HR-0004", firstName: "Nicole", middleName: "Velasco", lastName: "Lumapas", birthDate: "1999-12-17", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 202 4002", occupation: "Customer Service Representative", addressLine: "Purok 4, Riverside Drive", purok: "Purok 4" },
    { id: "seed-resident-hr-alvin-montenegro", householdNo: "HR-0005", firstName: "Alvin", middleName: "Sarmiento", lastName: "Montenegro", birthDate: "1983-05-28", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 202 5001", occupation: "Public Utility Driver", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5" },
    { id: "seed-resident-hr-maribel-montenegro", householdNo: "HR-0005", firstName: "Maribel", middleName: "Castro", lastName: "Montenegro", birthDate: "1985-07-16", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 202 5002", occupation: "Seamstress", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5" },
    { id: "seed-resident-hr-joshua-montenegro", householdNo: "HR-0005", firstName: "Joshua", middleName: "Castro", lastName: "Montenegro", birthDate: "2004-03-11", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 202 5003", occupation: "Vocational Student", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5" },
    { id: "seed-resident-hr-sofia-montenegro", householdNo: "HR-0005", firstName: "Sofia", middleName: "Castro", lastName: "Montenegro", birthDate: "2010-08-26", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 202 5004", occupation: "Student", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5" },
  ];

  for (const resident of residents) {
    const household = householdByNo.get(resident.householdNo);
    const data = {
      barangayId: barangay.id,
      householdId: household?.id,
      firstName: resident.firstName,
      middleName: resident.middleName,
      lastName: resident.lastName,
      birthDate: new Date(resident.birthDate),
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
    };
    await prisma.resident.upsert({ where: { id: resident.id }, update: data, create: { id: resident.id, ...data } });
  }

  const householdHeads = [
    ["HR-0001", "seed-resident-hr-ramon-aquino"],
    ["HR-0002", "seed-resident-hr-ernesto-bautista"],
    ["HR-0003", "seed-resident-hr-mario-canete"],
    ["HR-0004", "seed-resident-hr-teresa-lumapas"],
    ["HR-0005", "seed-resident-hr-alvin-montenegro"],
  ] as const;
  for (const [householdNo, headResidentId] of householdHeads) {
    await prisma.household.update({
      where: { barangayId_householdNo: { barangayId: barangay.id, householdNo } },
      data: { headResidentId },
    });
  }

  const secretary = users.get("secretary@holyredeemer.local");
  const captain = users.get("captain@holyredeemer.local");
  const staff = users.get("staff@holyredeemer.local");
  const admin = users.get("admin@holyredeemer.local");
  const certificates = [
    { controlNumber: "HOLYREDEEMER-2026-0001", residentId: "seed-resident-hr-camille-aquino", requestedById: secretary?.id, approvedById: null, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.DRAFT, purpose: "University scholarship application", remarks: "Draft prepared for resident verification.", issuedAt: null, releasedAt: null },
    { controlNumber: "HOLYREDEEMER-2026-0002", residentId: "seed-resident-hr-nicole-lumapas", requestedById: staff?.id, approvedById: null, certificateType: CertificateType.RESIDENCY, status: CertificateStatus.PENDING_APPROVAL, purpose: "Employment onboarding requirement", remarks: "Awaiting captain approval.", issuedAt: null, releasedAt: null },
    { controlNumber: "HOLYREDEEMER-2026-0003", residentId: "seed-resident-hr-mario-canete", requestedById: secretary?.id, approvedById: null, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.PENDING_APPROVAL, purpose: "Electrical contractor accreditation", remarks: "Supporting records have been reviewed.", issuedAt: null, releasedAt: null },
    { controlNumber: "HOLYREDEEMER-2026-0004", residentId: "seed-resident-hr-ernesto-bautista", requestedById: secretary?.id, approvedById: captain?.id, certificateType: CertificateType.INDIGENCY, status: CertificateStatus.APPROVED, purpose: "Hospital assistance application", remarks: "Approved for release.", issuedAt: new Date("2026-07-24T09:20:00+08:00"), releasedAt: null },
    { controlNumber: "HOLYREDEEMER-2026-0005", residentId: "seed-resident-hr-alvin-montenegro", requestedById: staff?.id, approvedById: captain?.id, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.RELEASED, purpose: "Driver franchise renewal", remarks: "Released to requesting resident.", issuedAt: new Date("2026-07-18T10:10:00+08:00"), releasedAt: new Date("2026-07-18T14:35:00+08:00") },
    { controlNumber: "HOLYREDEEMER-2026-0006", residentId: "seed-resident-hr-grace-bautista", requestedById: secretary?.id, approvedById: captain?.id, certificateType: CertificateType.RESIDENCY, status: CertificateStatus.RELEASED, purpose: "Professional license renewal", remarks: "Released after identity verification.", issuedAt: new Date("2026-07-21T08:45:00+08:00"), releasedAt: new Date("2026-07-21T11:30:00+08:00") },
  ];
  for (const certificate of certificates) {
    await prisma.certificateRequest.upsert({
      where: { barangayId_controlNumber: { barangayId: barangay.id, controlNumber: certificate.controlNumber } },
      update: certificate,
      create: { ...certificate, barangayId: barangay.id },
    });
  }

  const publicRequests = [
    { trackingCode: "HR-PUB-2026-0001", residentId: "seed-resident-hr-liza-aquino", firstName: "Liza", middleName: "Perez", lastName: "Aquino", birthDate: new Date("1978-08-09"), requesterName: "Liza P. Aquino", requesterEmail: "liza.aquino@example.local", requesterMobile: "+63 917 202 1002", certificateType: CertificateType.RESIDENCY, status: PublicRequestStatus.SUBMITTED, purpose: "Water account update", addressLine: "Purok 1, Mabini Street", purok: "Purok 1", notes: "Submitted through the public request portal.", reviewedAt: null, completedAt: null },
    { trackingCode: "HR-PUB-2026-0002", residentId: "seed-resident-hr-joshua-montenegro", firstName: "Joshua", middleName: "Castro", lastName: "Montenegro", birthDate: new Date("2004-03-11"), requesterName: "Joshua C. Montenegro", requesterEmail: "joshua.montenegro@example.local", requesterMobile: "+63 917 202 5003", certificateType: CertificateType.BARANGAY_CLEARANCE, status: PublicRequestStatus.UNDER_REVIEW, purpose: "On-the-job training requirement", addressLine: "Purok 5, Butuan-Cabadbaran Road", purok: "Purok 5", notes: "Resident details are being validated.", reviewedAt: new Date("2026-07-29T10:15:00+08:00"), completedAt: null },
    { trackingCode: "HR-PUB-2026-0003", residentId: "seed-resident-hr-teresa-lumapas", firstName: "Teresa", middleName: "Velasco", lastName: "Lumapas", birthDate: new Date("1966-09-03"), requesterName: "Teresa V. Lumapas", requesterEmail: "teresa.lumapas@example.local", requesterMobile: "+63 917 202 4001", certificateType: CertificateType.INDIGENCY, status: PublicRequestStatus.NEEDS_MORE_INFO, purpose: "Medical assistance application", addressLine: "Purok 4, Riverside Drive", purok: "Purok 4", notes: "Please provide the hospital referral or medical abstract.", reviewedAt: new Date("2026-07-28T14:40:00+08:00"), completedAt: null },
    { trackingCode: "HR-PUB-2026-0004", residentId: "seed-resident-hr-jessa-canete", firstName: "Jessa", middleName: "Rivera", lastName: "Canete", birthDate: new Date("1991-10-07"), requesterName: "Jessa R. Canete", requesterEmail: "jessa.canete@example.local", requesterMobile: "+63 917 202 3002", certificateType: CertificateType.RESIDENCY, status: PublicRequestStatus.READY_FOR_PICKUP, purpose: "School employment record", addressLine: "Purok 3, Narra Avenue", purok: "Purok 3", notes: "Document is ready at the barangay hall.", reviewedAt: new Date("2026-07-25T09:30:00+08:00"), completedAt: new Date("2026-07-26T08:20:00+08:00") },
    { trackingCode: "HR-PUB-2026-0005", residentId: "seed-resident-hr-ramon-aquino", firstName: "Ramon", middleName: "Garcia", lastName: "Aquino", birthDate: new Date("1975-03-18"), requesterName: "Ramon G. Aquino", requesterEmail: "ramon.aquino@example.local", requesterMobile: "+63 917 202 1001", certificateType: CertificateType.BARANGAY_CLEARANCE, status: PublicRequestStatus.RELEASED, purpose: "Delivery operator renewal", addressLine: "Purok 1, Mabini Street", purok: "Purok 1", notes: "Released after identity verification.", reviewedAt: new Date("2026-07-20T13:15:00+08:00"), completedAt: new Date("2026-07-21T10:05:00+08:00") },
  ];
  for (const request of publicRequests) {
    await prisma.publicDocumentRequest.upsert({ where: { trackingCode: request.trackingCode }, update: { ...request, barangayId: barangay.id }, create: { ...request, barangayId: barangay.id } });
  }

  const accountData = {
    barangayId: barangay.id,
    residentId: null,
    firstName: "Marites",
    middleName: "Dela Pena",
    lastName: "Sayon",
    suffix: null,
    birthDate: new Date("1994-02-08T00:00:00+08:00"),
    gender: "Female",
    contactNumber: "+63 917 202 6001",
    passwordHash,
    addressLine: "Purok 2, Holy Redeemer Access Road",
    purok: "Purok 2",
    status: ResidentAccountStatus.PENDING_VERIFICATION,
    verifiedAt: null,
  };
  await prisma.residentAccount.upsert({
    where: { barangayId_email: { barangayId: barangay.id, email: "marites.sayon@example.local" } },
    update: accountData,
    create: { id: "seed-resident-account-hr-marites-sayon", email: "marites.sayon@example.local", ...accountData },
  });
  await prisma.residentVerificationRequest.upsert({
    where: { id: "seed-verification-hr-marites-sayon" },
    update: { barangayId: barangay.id, accountId: "seed-resident-account-hr-marites-sayon", residentId: null, status: ResidentAccountStatus.PENDING_VERIFICATION, purpose: "Online account registration for requesting barangay certificates.", staffNotes: null, reviewedById: null, reviewedAt: null },
    create: { id: "seed-verification-hr-marites-sayon", barangayId: barangay.id, accountId: "seed-resident-account-hr-marites-sayon", status: ResidentAccountStatus.PENDING_VERIFICATION, purpose: "Online account registration for requesting barangay certificates." },
  });

  const announcements = [
    { id: "seed-announcement-hr-dengue-cleanup", title: "Community Dengue Prevention and Clean-Up Drive", body: "Residents are invited to join the barangay-wide clean-up drive this Saturday at 7:00 AM. Teams will inspect common areas, clear drainage, and remove containers with stagnant water.", category: "Health", isPublished: true, publishedAt: new Date("2026-07-20T08:00:00+08:00"), createdById: secretary?.id },
    { id: "seed-announcement-hr-immunization", title: "Free Childhood Immunization and Health Consultation", body: "The Barangay Health Station will provide free childhood immunization and basic health consultations on August 8 from 8:30 AM to 3:00 PM. Parents should bring each child's health card.", category: "Health", isPublished: true, publishedAt: new Date("2026-07-27T09:00:00+08:00"), createdById: admin?.id },
    { id: "seed-announcement-hr-water-advisory", title: "Temporary Water Service Interruption Advisory", body: "Scheduled line maintenance may interrupt water service in Puroks 3, 4, and 5 on August 5 from 9:00 AM to 4:00 PM. Affected households are advised to store enough water beforehand.", category: "Advisory", isPublished: true, publishedAt: new Date("2026-08-02T10:30:00+08:00"), createdById: secretary?.id },
    { id: "seed-announcement-hr-sports-league", title: "Holy Redeemer Inter-Purok Sports League Registration", body: "Registration for the barangay basketball and volleyball leagues will open at the barangay hall. Team managers should prepare their player lists and proof of residency.", category: "Youth and Sports", isPublished: false, publishedAt: null, createdById: staff?.id },
  ];
  for (const announcement of announcements) {
    const data = { barangayId: barangay.id, title: announcement.title, body: announcement.body, category: announcement.category, featuredImageUrl: null, attachmentUrl: null, isPublished: announcement.isPublished, publishedAt: announcement.publishedAt, createdById: announcement.createdById };
    await prisma.announcement.upsert({ where: { id: announcement.id }, update: data, create: { id: announcement.id, ...data } });
  }

  const officials = [
    { id: "seed-official-hr-captain", name: "Hon. Daniel M. Cabahug", position: "Barangay Captain", contact: "+63 917 555 0276", displayOrder: 1 },
    { id: "seed-official-hr-secretary", name: "Lorna V. Ecleo", position: "Barangay Secretary", contact: "office@holyredeemer.local", displayOrder: 2 },
    { id: "seed-official-hr-treasurer", name: "Rebecca S. Amora", position: "Barangay Treasurer", contact: "+63 917 555 0277", displayOrder: 3 },
    { id: "seed-official-hr-kagawad-balan", name: "Noel P. Balan", position: "Barangay Kagawad - Peace and Order", contact: "+63 917 555 0278", displayOrder: 4 },
    { id: "seed-official-hr-kagawad-tiu", name: "Jocelyn R. Tiu", position: "Barangay Kagawad - Health and Sanitation", contact: "+63 917 555 0279", displayOrder: 5 },
  ];
  for (const official of officials) {
    const data = { barangayId: barangay.id, name: official.name, position: official.position, contact: official.contact, photoUrl: null, displayOrder: official.displayOrder, isPublished: true };
    await prisma.publicOfficial.upsert({ where: { id: official.id }, update: data, create: { id: official.id, ...data } });
  }

  const services = [
    { id: "seed-service-hr-clearance", name: "Barangay Clearance", description: "Certificate for employment, business registration, internship, accreditation, and other official requirements.", requirements: "Valid ID; purpose of request; updated resident profile", processingTime: "Same day if records are complete", feeText: "Please confirm applicable fees at the barangay hall.", displayOrder: 1 },
    { id: "seed-service-hr-residency", name: "Certificate of Residency", description: "Official proof that a resident currently lives in Barangay Holy Redeemer.", requirements: "Valid ID; current address; purok information", processingTime: "Same day review", feeText: "Free for most public service requirements.", displayOrder: 2 },
    { id: "seed-service-hr-indigency", name: "Certificate of Indigency", description: "Supporting document for medical, educational, legal-aid, and social assistance applications.", requirements: "Valid ID; statement of purpose; household information", processingTime: "1 working day", feeText: "No fee", displayOrder: 3 },
  ];
  for (const service of services) {
    const data = { barangayId: barangay.id, name: service.name, description: service.description, requirements: service.requirements, processingTime: service.processingTime, feeText: service.feeText, attachmentUrl: null, requestLink: `/b/${barangay.slug}/request`, displayOrder: service.displayOrder, isPublished: true };
    await prisma.publicService.upsert({ where: { id: service.id }, update: data, create: { id: service.id, ...data } });
  }

  const auditLogs = [
    { id: "seed-audit-hr-user-login", userId: admin?.id, action: "USER_LOGIN", entity: "User", entityId: admin?.id, metadata: { email: "admin@holyredeemer.local", result: "success" } },
    { id: "seed-audit-hr-resident-created", userId: secretary?.id, action: "RESIDENT_CREATED", entity: "Resident", entityId: "seed-resident-hr-ramon-aquino", metadata: { residentName: "Ramon Aquino", source: "seed" } },
    { id: "seed-audit-hr-certificate-submitted", userId: staff?.id, action: "CERTIFICATE_SUBMITTED", entity: "CertificateRequest", entityId: "HOLYREDEEMER-2026-0002", metadata: { controlNumber: "HOLYREDEEMER-2026-0002", status: CertificateStatus.PENDING_APPROVAL } },
    { id: "seed-audit-hr-certificate-approved", userId: captain?.id, action: "CERTIFICATE_APPROVED", entity: "CertificateRequest", entityId: "HOLYREDEEMER-2026-0004", metadata: { controlNumber: "HOLYREDEEMER-2026-0004", status: CertificateStatus.APPROVED } },
    { id: "seed-audit-hr-public-request-reviewed", userId: staff?.id, action: "PUBLIC_REQUEST_REVIEWED", entity: "PublicDocumentRequest", entityId: "HR-PUB-2026-0002", metadata: { trackingCode: "HR-PUB-2026-0002", status: PublicRequestStatus.UNDER_REVIEW } },
  ];
  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: { barangayId: barangay.id, userId: auditLog.userId, action: auditLog.action, entity: auditLog.entity, entityId: auditLog.entityId, metadata: auditLog.metadata, ipAddress: "127.0.0.1", userAgent: "Prisma seed" },
      create: { ...auditLog, barangayId: barangay.id, ipAddress: "127.0.0.1", userAgent: "Prisma seed" },
    });
  }
}

async function seedBuhangin(freePlanId: string, passwordHash: string) {
  const barangay = await prisma.barangay.upsert({
    where: { slug: "buhangin" },
    update: {
      name: "Barangay Buhangin",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      contactEmail: "office@buhangin.local",
      contactNumber: "+63 917 555 0360",
    },
    create: {
      name: "Barangay Buhangin",
      municipality: "Butuan City",
      province: "Agusan del Norte",
      region: "Region XIII",
      slug: "buhangin",
      contactEmail: "office@buhangin.local",
      contactNumber: "+63 917 555 0360",
    },
  });

  const settings = {
    certificatePrefix: "BUHANGIN",
    officeAddress: "Barangay Buhangin Hall, Purok 3, Riverside Road, Butuan City, Agusan del Norte",
    officeHours: "Monday to Friday, 8:00 AM to 5:00 PM",
    captainName: "Hon. Ernesto L. Dagohoy",
    secretaryName: "Marissa Q. Neri",
    treasurerName: "Evelyn C. Paderanga",
    skChairpersonName: "Janine F. Busa",
    officialHeaderLine1: "Republic of the Philippines",
    officialHeaderLine2: "City of Butuan, Province of Agusan del Norte",
    officialHeaderLine3: "Barangay Buhangin",
    releaseInstructions: "Approved documents may be claimed at the barangay hall upon presentation of a valid ID and the applicable tracking or control number.",
    certificateFooterNote: "This certification is issued for the stated purpose and may be verified through the barangay records system.",
    logoUrl: null,
    sealUrl: null,
    welcomeTitle: "Welcome to Barangay Buhangin",
    welcomeMessage: "Access document services, community updates, and resident assistance from Barangay Buhangin online.",
    publicServiceTagline: "Responsive local services for every Buhangin household.",
    primaryColor: "#b45309",
    secondaryColor: "#0369a1",
    facebookPageUrl: "https://www.facebook.com/barangaybuhanginbutuan",
  };

  await prisma.barangaySetting.upsert({
    where: { barangayId: barangay.id },
    update: settings,
    create: { barangayId: barangay.id, ...settings },
  });

  await prisma.subscription.upsert({
    where: { id: "seed-buhangin-subscription" },
    update: { barangayId: barangay.id, planId: freePlanId, status: SubscriptionStatus.TRIAL },
    create: { id: "seed-buhangin-subscription", barangayId: barangay.id, planId: freePlanId, status: SubscriptionStatus.TRIAL },
  });

  const userSeeds = [
    { name: "Patricia N. Rosales", email: "admin@buhangin.local", role: Role.ADMIN },
    { name: "Marissa Q. Neri", email: "secretary@buhangin.local", role: Role.SECRETARY },
    { name: "Ernesto L. Dagohoy", email: "captain@buhangin.local", role: Role.CAPTAIN },
    { name: "Jerome A. Manliguez", email: "staff@buhangin.local", role: Role.STAFF },
  ];
  const users = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();

  for (const user of userSeeds) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash, isActive: true, barangayId: barangay.id },
      create: { ...user, passwordHash, isActive: true, barangayId: barangay.id },
    });
    users.set(user.email, savedUser);
  }

  const households = [
    { id: "seed-household-bu-villamor", householdNo: "BU-0001", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1" },
    { id: "seed-household-bu-salcedo", householdNo: "BU-0002", addressLine: "Purok 2, Molave Street", purok: "Purok 2" },
    { id: "seed-household-bu-dacera", householdNo: "BU-0003", addressLine: "Purok 3, Sandbar Avenue", purok: "Purok 3" },
    { id: "seed-household-bu-ocampo", householdNo: "BU-0004", addressLine: "Purok 4, Baybay Extension", purok: "Purok 4" },
    { id: "seed-household-bu-ranola", householdNo: "BU-0005", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5" },
  ];

  for (const household of households) {
    await prisma.household.upsert({
      where: { barangayId_householdNo: { barangayId: barangay.id, householdNo: household.householdNo } },
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
    { id: "seed-resident-bu-rogelio-villamor", householdNo: "BU-0001", firstName: "Rogelio", middleName: "Mendoza", lastName: "Villamor", birthDate: "1972-04-19", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 303 1001", occupation: "Boat Operator", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1" },
    { id: "seed-resident-bu-corazon-villamor", householdNo: "BU-0001", firstName: "Corazon", middleName: "Bautista", lastName: "Villamor", birthDate: "1975-09-08", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 303 1002", occupation: "Laundry Shop Owner", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1" },
    { id: "seed-resident-bu-beatrice-villamor", householdNo: "BU-0001", firstName: "Beatrice", middleName: "Bautista", lastName: "Villamor", birthDate: "2003-12-02", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 303 1003", occupation: "Accounting Assistant", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1" },
    { id: "seed-resident-bu-milagros-salcedo", householdNo: "BU-0002", firstName: "Milagros", middleName: "Torres", lastName: "Salcedo", birthDate: "1960-02-23", gender: "Female", civilStatus: "Widowed", contactNumber: "+63 917 303 2001", occupation: "Retired Midwife", addressLine: "Purok 2, Molave Street", purok: "Purok 2" },
    { id: "seed-resident-bu-dennis-salcedo", householdNo: "BU-0002", firstName: "Dennis", middleName: "Torres", lastName: "Salcedo", birthDate: "1988-07-15", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 303 2002", occupation: "Welder", addressLine: "Purok 2, Molave Street", purok: "Purok 2" },
    { id: "seed-resident-bu-nestor-dacera", householdNo: "BU-0003", firstName: "Nestor", middleName: "Pascual", lastName: "Dacera", birthDate: "1985-01-27", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 303 3001", occupation: "Fish Vendor", addressLine: "Purok 3, Sandbar Avenue", purok: "Purok 3" },
    { id: "seed-resident-bu-aileen-dacera", householdNo: "BU-0003", firstName: "Aileen", middleName: "Rivera", lastName: "Dacera", birthDate: "1987-10-13", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 303 3002", occupation: "Day-care Worker", addressLine: "Purok 3, Sandbar Avenue", purok: "Purok 3" },
    { id: "seed-resident-bu-luis-dacera", householdNo: "BU-0003", firstName: "Luis", middleName: "Rivera", lastName: "Dacera", birthDate: "2012-05-06", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 303 3003", occupation: "Student", addressLine: "Purok 3, Sandbar Avenue", purok: "Purok 3" },
    { id: "seed-resident-bu-cherry-ocampo", householdNo: "BU-0004", firstName: "Cherry", middleName: "Alvarez", lastName: "Ocampo", birthDate: "1977-11-29", gender: "Female", civilStatus: "Separated", contactNumber: "+63 917 303 4001", occupation: "Sari-sari Store Owner", addressLine: "Purok 4, Baybay Extension", purok: "Purok 4" },
    { id: "seed-resident-bu-kenneth-ocampo", householdNo: "BU-0004", firstName: "Kenneth", middleName: "Alvarez", lastName: "Ocampo", birthDate: "2000-03-21", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 303 4002", occupation: "Motorcycle Mechanic", addressLine: "Purok 4, Baybay Extension", purok: "Purok 4" },
    { id: "seed-resident-bu-gilbert-ranola", householdNo: "BU-0005", firstName: "Gilbert", middleName: "Valdez", lastName: "Ranola", birthDate: "1981-06-17", gender: "Male", civilStatus: "Married", contactNumber: "+63 917 303 5001", occupation: "Security Guard", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5" },
    { id: "seed-resident-bu-sheila-ranola", householdNo: "BU-0005", firstName: "Sheila", middleName: "Castillo", lastName: "Ranola", birthDate: "1984-08-25", gender: "Female", civilStatus: "Married", contactNumber: "+63 917 303 5002", occupation: "Tailor", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5" },
    { id: "seed-resident-bu-adrian-ranola", householdNo: "BU-0005", firstName: "Adrian", middleName: "Castillo", lastName: "Ranola", birthDate: "2005-02-10", gender: "Male", civilStatus: "Single", contactNumber: "+63 917 303 5003", occupation: "Vocational Student", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5" },
    { id: "seed-resident-bu-mae-ranola", householdNo: "BU-0005", firstName: "Mae", middleName: "Castillo", lastName: "Ranola", birthDate: "2011-09-14", gender: "Female", civilStatus: "Single", contactNumber: "+63 917 303 5004", occupation: "Student", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5" },
  ];

  for (const resident of residents) {
    const household = householdByNo.get(resident.householdNo);
    const data = {
      barangayId: barangay.id,
      householdId: household?.id,
      firstName: resident.firstName,
      middleName: resident.middleName,
      lastName: resident.lastName,
      birthDate: new Date(resident.birthDate),
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
    };
    await prisma.resident.upsert({ where: { id: resident.id }, update: data, create: { id: resident.id, ...data } });
  }

  const householdHeads = [
    ["BU-0001", "seed-resident-bu-rogelio-villamor"],
    ["BU-0002", "seed-resident-bu-milagros-salcedo"],
    ["BU-0003", "seed-resident-bu-nestor-dacera"],
    ["BU-0004", "seed-resident-bu-cherry-ocampo"],
    ["BU-0005", "seed-resident-bu-gilbert-ranola"],
  ] as const;
  for (const [householdNo, headResidentId] of householdHeads) {
    await prisma.household.update({
      where: { barangayId_householdNo: { barangayId: barangay.id, householdNo } },
      data: { headResidentId },
    });
  }

  const secretary = users.get("secretary@buhangin.local");
  const captain = users.get("captain@buhangin.local");
  const staff = users.get("staff@buhangin.local");
  const admin = users.get("admin@buhangin.local");
  const certificates = [
    { controlNumber: "BUHANGIN-2026-0001", residentId: "seed-resident-bu-beatrice-villamor", requestedById: secretary?.id, approvedById: null, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.DRAFT, purpose: "Graduate scholarship application", remarks: "Draft prepared for resident verification.", issuedAt: null, releasedAt: null },
    { controlNumber: "BUHANGIN-2026-0002", residentId: "seed-resident-bu-kenneth-ocampo", requestedById: staff?.id, approvedById: null, certificateType: CertificateType.RESIDENCY, status: CertificateStatus.PENDING_APPROVAL, purpose: "Employment onboarding requirement", remarks: "Awaiting captain approval.", issuedAt: null, releasedAt: null },
    { controlNumber: "BUHANGIN-2026-0003", residentId: "seed-resident-bu-nestor-dacera", requestedById: secretary?.id, approvedById: null, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.PENDING_APPROVAL, purpose: "Market vendor permit renewal", remarks: "Supporting records have been reviewed.", issuedAt: null, releasedAt: null },
    { controlNumber: "BUHANGIN-2026-0004", residentId: "seed-resident-bu-milagros-salcedo", requestedById: secretary?.id, approvedById: captain?.id, certificateType: CertificateType.INDIGENCY, status: CertificateStatus.APPROVED, purpose: "Maintenance medicine assistance", remarks: "Approved for release.", issuedAt: new Date("2026-07-26T09:10:00+08:00"), releasedAt: null },
    { controlNumber: "BUHANGIN-2026-0005", residentId: "seed-resident-bu-gilbert-ranola", requestedById: staff?.id, approvedById: captain?.id, certificateType: CertificateType.BARANGAY_CLEARANCE, status: CertificateStatus.RELEASED, purpose: "Security-license renewal", remarks: "Released to requesting resident.", issuedAt: new Date("2026-07-19T10:25:00+08:00"), releasedAt: new Date("2026-07-19T14:20:00+08:00") },
    { controlNumber: "BUHANGIN-2026-0006", residentId: "seed-resident-bu-aileen-dacera", requestedById: secretary?.id, approvedById: captain?.id, certificateType: CertificateType.RESIDENCY, status: CertificateStatus.RELEASED, purpose: "Government employment requirement", remarks: "Released after identity verification.", issuedAt: new Date("2026-07-22T08:55:00+08:00"), releasedAt: new Date("2026-07-22T11:15:00+08:00") },
  ];
  for (const certificate of certificates) {
    await prisma.certificateRequest.upsert({
      where: { barangayId_controlNumber: { barangayId: barangay.id, controlNumber: certificate.controlNumber } },
      update: certificate,
      create: { ...certificate, barangayId: barangay.id },
    });
  }

  const publicRequests = [
    { trackingCode: "BU-PUB-2026-0001", residentId: "seed-resident-bu-corazon-villamor", firstName: "Corazon", middleName: "Bautista", lastName: "Villamor", birthDate: new Date("1975-09-08"), requesterName: "Corazon B. Villamor", requesterEmail: "corazon.villamor@example.local", requesterMobile: "+63 917 303 1002", certificateType: CertificateType.RESIDENCY, status: PublicRequestStatus.SUBMITTED, purpose: "Electricity account update", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1", notes: "Submitted through the public request portal.", reviewedAt: null, completedAt: null },
    { trackingCode: "BU-PUB-2026-0002", residentId: "seed-resident-bu-adrian-ranola", firstName: "Adrian", middleName: "Castillo", lastName: "Ranola", birthDate: new Date("2005-02-10"), requesterName: "Adrian C. Ranola", requesterEmail: "adrian.ranola@example.local", requesterMobile: "+63 917 303 5003", certificateType: CertificateType.BARANGAY_CLEARANCE, status: PublicRequestStatus.UNDER_REVIEW, purpose: "Apprenticeship requirement", addressLine: "Purok 5, Mahogany Road", purok: "Purok 5", notes: "Resident details and training purpose are being validated.", reviewedAt: new Date("2026-07-30T10:05:00+08:00"), completedAt: null },
    { trackingCode: "BU-PUB-2026-0003", residentId: "seed-resident-bu-cherry-ocampo", firstName: "Cherry", middleName: "Alvarez", lastName: "Ocampo", birthDate: new Date("1977-11-29"), requesterName: "Cherry A. Ocampo", requesterEmail: "cherry.ocampo@example.local", requesterMobile: "+63 917 303 4001", certificateType: CertificateType.INDIGENCY, status: PublicRequestStatus.NEEDS_MORE_INFO, purpose: "Medical assistance application", addressLine: "Purok 4, Baybay Extension", purok: "Purok 4", notes: "Please provide the hospital referral or medical abstract.", reviewedAt: new Date("2026-07-29T14:25:00+08:00"), completedAt: null },
    { trackingCode: "BU-PUB-2026-0004", residentId: "seed-resident-bu-dennis-salcedo", firstName: "Dennis", middleName: "Torres", lastName: "Salcedo", birthDate: new Date("1988-07-15"), requesterName: "Dennis T. Salcedo", requesterEmail: "dennis.salcedo@example.local", requesterMobile: "+63 917 303 2002", certificateType: CertificateType.RESIDENCY, status: PublicRequestStatus.READY_FOR_PICKUP, purpose: "Bank customer-information update", addressLine: "Purok 2, Molave Street", purok: "Purok 2", notes: "Document is ready at the barangay hall.", reviewedAt: new Date("2026-07-27T09:15:00+08:00"), completedAt: new Date("2026-07-28T08:30:00+08:00") },
    { trackingCode: "BU-PUB-2026-0005", residentId: "seed-resident-bu-rogelio-villamor", firstName: "Rogelio", middleName: "Mendoza", lastName: "Villamor", birthDate: new Date("1972-04-19"), requesterName: "Rogelio M. Villamor", requesterEmail: "rogelio.villamor@example.local", requesterMobile: "+63 917 303 1001", certificateType: CertificateType.BARANGAY_CLEARANCE, status: PublicRequestStatus.RELEASED, purpose: "Livelihood registration renewal", addressLine: "Purok 1, Riverside Lane", purok: "Purok 1", notes: "Released after identity verification.", reviewedAt: new Date("2026-07-21T13:25:00+08:00"), completedAt: new Date("2026-07-22T10:10:00+08:00") },
  ];
  for (const request of publicRequests) {
    await prisma.publicDocumentRequest.upsert({ where: { trackingCode: request.trackingCode }, update: { ...request, barangayId: barangay.id }, create: { ...request, barangayId: barangay.id } });
  }

  const accountData = {
    barangayId: barangay.id,
    residentId: null,
    firstName: "Janelle",
    middleName: "Mercado",
    lastName: "Cabonce",
    suffix: null,
    birthDate: new Date("1996-04-07T00:00:00+08:00"),
    gender: "Female",
    contactNumber: "+63 917 303 6001",
    passwordHash,
    addressLine: "Purok 2, Buhangin Riverside Access Road",
    purok: "Purok 2",
    status: ResidentAccountStatus.PENDING_VERIFICATION,
    verifiedAt: null,
  };
  await prisma.residentAccount.upsert({
    where: { barangayId_email: { barangayId: barangay.id, email: "janelle.cabonce@example.local" } },
    update: accountData,
    create: { id: "seed-resident-account-bu-janelle-cabonce", email: "janelle.cabonce@example.local", ...accountData },
  });
  await prisma.residentVerificationRequest.upsert({
    where: { id: "seed-verification-bu-janelle-cabonce" },
    update: { barangayId: barangay.id, accountId: "seed-resident-account-bu-janelle-cabonce", residentId: null, status: ResidentAccountStatus.PENDING_VERIFICATION, purpose: "Online account registration for requesting barangay certificates.", staffNotes: null, reviewedById: null, reviewedAt: null },
    create: { id: "seed-verification-bu-janelle-cabonce", barangayId: barangay.id, accountId: "seed-resident-account-bu-janelle-cabonce", status: ResidentAccountStatus.PENDING_VERIFICATION, purpose: "Online account registration for requesting barangay certificates." },
  });

  const announcements = [
    { id: "seed-announcement-bu-riverside-cleanup", title: "Riverside Clean-Up and Flood Preparedness Activity", body: "Residents are invited to join the riverside clean-up this Saturday at 7:00 AM. Volunteers will clear drainage channels, collect riverbank waste, and attend a short flood-preparedness orientation.", category: "Environment", isPublished: true, publishedAt: new Date("2026-07-21T08:00:00+08:00"), createdById: secretary?.id },
    { id: "seed-announcement-bu-senior-health", title: "Free Anti-Flu Vaccination and Senior Health Check", body: "The Barangay Health Station will offer free anti-flu vaccination and basic health checks for senior citizens on August 10 from 8:30 AM to 3:00 PM. Please bring a senior ID and health record.", category: "Health", isPublished: true, publishedAt: new Date("2026-07-29T09:00:00+08:00"), createdById: admin?.id },
    { id: "seed-announcement-bu-drainage-advisory", title: "Drainage Improvement Work and Temporary Road Access Advisory", body: "Drainage improvement work will temporarily limit vehicle access along Riverside Lane and Baybay Extension on August 6 from 8:00 AM to 5:00 PM. Please use the marked alternate routes.", category: "Advisory", isPublished: true, publishedAt: new Date("2026-08-03T10:00:00+08:00"), createdById: secretary?.id },
    { id: "seed-announcement-bu-livelihood-fair", title: "Buhangin Livelihood and Skills Fair", body: "Registration will open for food-processing, tailoring, welding, and small-business orientation sessions. Interested residents may register at the barangay hall once the final schedule is announced.", category: "Livelihood", isPublished: false, publishedAt: null, createdById: staff?.id },
  ];
  for (const announcement of announcements) {
    const data = { barangayId: barangay.id, title: announcement.title, body: announcement.body, category: announcement.category, featuredImageUrl: null, attachmentUrl: null, isPublished: announcement.isPublished, publishedAt: announcement.publishedAt, createdById: announcement.createdById };
    await prisma.announcement.upsert({ where: { id: announcement.id }, update: data, create: { id: announcement.id, ...data } });
  }

  const officials = [
    { id: "seed-official-bu-captain", name: "Hon. Ernesto L. Dagohoy", position: "Barangay Captain", contact: "+63 917 555 0360", displayOrder: 1 },
    { id: "seed-official-bu-secretary", name: "Marissa Q. Neri", position: "Barangay Secretary", contact: "office@buhangin.local", displayOrder: 2 },
    { id: "seed-official-bu-treasurer", name: "Evelyn C. Paderanga", position: "Barangay Treasurer", contact: "+63 917 555 0361", displayOrder: 3 },
    { id: "seed-official-bu-kagawad-ladera", name: "Renato G. Ladera", position: "Barangay Kagawad - Disaster Preparedness", contact: "+63 917 555 0362", displayOrder: 4 },
    { id: "seed-official-bu-kagawad-cagas", name: "Alma S. Cagas", position: "Barangay Kagawad - Livelihood and Social Services", contact: "+63 917 555 0363", displayOrder: 5 },
  ];
  for (const official of officials) {
    const data = { barangayId: barangay.id, name: official.name, position: official.position, contact: official.contact, photoUrl: null, displayOrder: official.displayOrder, isPublished: true };
    await prisma.publicOfficial.upsert({ where: { id: official.id }, update: data, create: { id: official.id, ...data } });
  }

  const services = [
    { id: "seed-service-bu-clearance", name: "Barangay Clearance", description: "Certificate for employment, permits, licensing, apprenticeship, and other official requirements.", requirements: "Valid ID; purpose of request; updated resident profile", processingTime: "Same day if records are complete", feeText: "Please confirm applicable fees at the barangay hall.", displayOrder: 1 },
    { id: "seed-service-bu-residency", name: "Certificate of Residency", description: "Official proof that a resident currently lives in Barangay Buhangin.", requirements: "Valid ID; current address; purok information", processingTime: "Same day review", feeText: "Free for most public service requirements.", displayOrder: 2 },
    { id: "seed-service-bu-indigency", name: "Certificate of Indigency", description: "Supporting document for medical, educational, legal-aid, and social-service assistance.", requirements: "Valid ID; statement of purpose; household information", processingTime: "1 working day", feeText: "No fee", displayOrder: 3 },
  ];
  for (const service of services) {
    const data = { barangayId: barangay.id, name: service.name, description: service.description, requirements: service.requirements, processingTime: service.processingTime, feeText: service.feeText, attachmentUrl: null, requestLink: `/b/${barangay.slug}/request`, displayOrder: service.displayOrder, isPublished: true };
    await prisma.publicService.upsert({ where: { id: service.id }, update: data, create: { id: service.id, ...data } });
  }

  const auditLogs = [
    { id: "seed-audit-bu-user-login", userId: admin?.id, action: "USER_LOGIN", entity: "User", entityId: admin?.id, metadata: { email: "admin@buhangin.local", result: "success" } },
    { id: "seed-audit-bu-resident-created", userId: secretary?.id, action: "RESIDENT_CREATED", entity: "Resident", entityId: "seed-resident-bu-rogelio-villamor", metadata: { residentName: "Rogelio Villamor", source: "seed" } },
    { id: "seed-audit-bu-certificate-submitted", userId: staff?.id, action: "CERTIFICATE_SUBMITTED", entity: "CertificateRequest", entityId: "BUHANGIN-2026-0002", metadata: { controlNumber: "BUHANGIN-2026-0002", status: CertificateStatus.PENDING_APPROVAL } },
    { id: "seed-audit-bu-certificate-approved", userId: captain?.id, action: "CERTIFICATE_APPROVED", entity: "CertificateRequest", entityId: "BUHANGIN-2026-0004", metadata: { controlNumber: "BUHANGIN-2026-0004", status: CertificateStatus.APPROVED } },
    { id: "seed-audit-bu-public-request-reviewed", userId: staff?.id, action: "PUBLIC_REQUEST_REVIEWED", entity: "PublicDocumentRequest", entityId: "BU-PUB-2026-0002", metadata: { trackingCode: "BU-PUB-2026-0002", status: PublicRequestStatus.UNDER_REVIEW } },
  ];
  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: { barangayId: barangay.id, userId: auditLog.userId, action: auditLog.action, entity: auditLog.entity, entityId: auditLog.entityId, metadata: auditLog.metadata, ipAddress: "127.0.0.1", userAgent: "Prisma seed" },
      create: { ...auditLog, barangayId: barangay.id, ipAddress: "127.0.0.1", userAgent: "Prisma seed" },
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
