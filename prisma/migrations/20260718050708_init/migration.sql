-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'CAPTAIN', 'STAFF');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('BARANGAY_CLEARANCE', 'RESIDENCY', 'INDIGENCY');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublicRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFO', 'FOR_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP', 'READY_FOR_DOWNLOAD', 'RELEASED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResidentAccountStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'NEEDS_MORE_INFO', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Barangay" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barangay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "maxUsers" INTEGER,
    "maxResidents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "headResidentId" TEXT,
    "householdNo" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "addressBarangay" TEXT,
    "city" TEXT,
    "province" TEXT,
    "purok" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "householdId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "civilStatus" TEXT,
    "contactNumber" TEXT,
    "occupation" TEXT,
    "citizenship" TEXT NOT NULL DEFAULT 'Filipino',
    "addressLine" TEXT NOT NULL,
    "addressBarangay" TEXT,
    "city" TEXT,
    "province" TEXT,
    "purok" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateRequest" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "residentId" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "certificateType" "CertificateType" NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "purpose" TEXT,
    "remarks" TEXT,
    "controlNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicDocumentRequest" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "residentId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3),
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requesterMobile" TEXT NOT NULL,
    "residentAccountId" TEXT,
    "certificateType" "CertificateType" NOT NULL,
    "status" "PublicRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "purpose" TEXT,
    "addressLine" TEXT NOT NULL,
    "purok" TEXT,
    "notes" TEXT,
    "trackingCode" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentAccount" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "residentId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "purok" TEXT,
    "status" "ResidentAccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentVerificationRequest" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "residentId" TEXT,
    "status" "ResidentAccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "purpose" TEXT,
    "staffNotes" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangaySetting" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "certificatePrefix" TEXT NOT NULL DEFAULT 'BRGY',
    "releaseInstructions" TEXT,
    "officeAddress" TEXT,
    "officeHours" TEXT,
    "captainName" TEXT,
    "secretaryName" TEXT,
    "treasurerName" TEXT,
    "skChairpersonName" TEXT,
    "officialHeaderLine1" TEXT,
    "officialHeaderLine2" TEXT,
    "officialHeaderLine3" TEXT,
    "certificateFooterNote" TEXT,
    "logoUrl" TEXT,
    "sealUrl" TEXT,
    "welcomeTitle" TEXT,
    "welcomeMessage" TEXT,
    "publicServiceTagline" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "facebookPageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarangaySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "featuredImageUrl" TEXT,
    "attachmentUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicOfficial" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "contact" TEXT,
    "photoUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicOfficial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicService" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "processingTime" TEXT,
    "feeText" TEXT,
    "attachmentUrl" TEXT,
    "requestLink" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Barangay_slug_key" ON "Barangay"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "Subscription_barangayId_idx" ON "Subscription"("barangayId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_barangayId_idx" ON "User"("barangayId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Household_barangayId_idx" ON "Household"("barangayId");

-- CreateIndex
CREATE INDEX "Household_headResidentId_idx" ON "Household"("headResidentId");

-- CreateIndex
CREATE UNIQUE INDEX "Household_barangayId_householdNo_key" ON "Household"("barangayId", "householdNo");

-- CreateIndex
CREATE INDEX "Resident_barangayId_idx" ON "Resident"("barangayId");

-- CreateIndex
CREATE INDEX "Resident_householdId_idx" ON "Resident"("householdId");

-- CreateIndex
CREATE INDEX "Resident_lastName_firstName_idx" ON "Resident"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "CertificateRequest_barangayId_idx" ON "CertificateRequest"("barangayId");

-- CreateIndex
CREATE INDEX "CertificateRequest_residentId_idx" ON "CertificateRequest"("residentId");

-- CreateIndex
CREATE INDEX "CertificateRequest_status_idx" ON "CertificateRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateRequest_barangayId_controlNumber_key" ON "CertificateRequest"("barangayId", "controlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PublicDocumentRequest_trackingCode_key" ON "PublicDocumentRequest"("trackingCode");

-- CreateIndex
CREATE INDEX "PublicDocumentRequest_barangayId_idx" ON "PublicDocumentRequest"("barangayId");

-- CreateIndex
CREATE INDEX "PublicDocumentRequest_residentId_idx" ON "PublicDocumentRequest"("residentId");

-- CreateIndex
CREATE INDEX "PublicDocumentRequest_residentAccountId_idx" ON "PublicDocumentRequest"("residentAccountId");

-- CreateIndex
CREATE INDEX "PublicDocumentRequest_status_idx" ON "PublicDocumentRequest"("status");

-- CreateIndex
CREATE INDEX "ResidentAccount_barangayId_idx" ON "ResidentAccount"("barangayId");

-- CreateIndex
CREATE INDEX "ResidentAccount_residentId_idx" ON "ResidentAccount"("residentId");

-- CreateIndex
CREATE INDEX "ResidentAccount_status_idx" ON "ResidentAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentAccount_barangayId_email_key" ON "ResidentAccount"("barangayId", "email");

-- CreateIndex
CREATE INDEX "ResidentVerificationRequest_barangayId_idx" ON "ResidentVerificationRequest"("barangayId");

-- CreateIndex
CREATE INDEX "ResidentVerificationRequest_accountId_idx" ON "ResidentVerificationRequest"("accountId");

-- CreateIndex
CREATE INDEX "ResidentVerificationRequest_residentId_idx" ON "ResidentVerificationRequest"("residentId");

-- CreateIndex
CREATE INDEX "ResidentVerificationRequest_status_idx" ON "ResidentVerificationRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BarangaySetting_barangayId_key" ON "BarangaySetting"("barangayId");

-- CreateIndex
CREATE INDEX "AuditLog_barangayId_idx" ON "AuditLog"("barangayId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Announcement_barangayId_idx" ON "Announcement"("barangayId");

-- CreateIndex
CREATE INDEX "Announcement_barangayId_isPublished_idx" ON "Announcement"("barangayId", "isPublished");

-- CreateIndex
CREATE INDEX "Announcement_createdById_idx" ON "Announcement"("createdById");

-- CreateIndex
CREATE INDEX "PublicOfficial_barangayId_idx" ON "PublicOfficial"("barangayId");

-- CreateIndex
CREATE INDEX "PublicOfficial_barangayId_isPublished_idx" ON "PublicOfficial"("barangayId", "isPublished");

-- CreateIndex
CREATE INDEX "PublicService_barangayId_idx" ON "PublicService"("barangayId");

-- CreateIndex
CREATE INDEX "PublicService_barangayId_isPublished_idx" ON "PublicService"("barangayId", "isPublished");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_headResidentId_fkey" FOREIGN KEY ("headResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicDocumentRequest" ADD CONSTRAINT "PublicDocumentRequest_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicDocumentRequest" ADD CONSTRAINT "PublicDocumentRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicDocumentRequest" ADD CONSTRAINT "PublicDocumentRequest_residentAccountId_fkey" FOREIGN KEY ("residentAccountId") REFERENCES "ResidentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentAccount" ADD CONSTRAINT "ResidentAccount_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentAccount" ADD CONSTRAINT "ResidentAccount_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentVerificationRequest" ADD CONSTRAINT "ResidentVerificationRequest_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentVerificationRequest" ADD CONSTRAINT "ResidentVerificationRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ResidentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentVerificationRequest" ADD CONSTRAINT "ResidentVerificationRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentVerificationRequest" ADD CONSTRAINT "ResidentVerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangaySetting" ADD CONSTRAINT "BarangaySetting_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicOfficial" ADD CONSTRAINT "PublicOfficial_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicService" ADD CONSTRAINT "PublicService_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
