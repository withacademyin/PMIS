/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KRAStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "KRAPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'SELECTED';

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "cheatingFlags" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contextBlob" TEXT,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "lastAssessmentAt" TIMESTAMP(3),
ADD COLUMN     "projectTypes" TEXT[],
ADD COLUMN     "skillScores" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "allowedColleges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalEntity" (
    "id" SERIAL NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "aliases" TEXT[],
    "embedding" vector,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CanonicalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSkill" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT,
    "source" TEXT NOT NULL,

    CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "InternshipStatus" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRA" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "KRAStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "KRAPriority" NOT NULL DEFAULT 'MEDIUM',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRAItem" (
    "id" TEXT NOT NULL,
    "kraId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRAItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRASubmission" (
    "id" TEXT NOT NULL,
    "kraId" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KRASubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Internship_applicationId_key" ON "Internship"("applicationId");

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "CanonicalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRA" ADD CONSTRAINT "KRA_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRAItem" ADD CONSTRAINT "KRAItem_kraId_fkey" FOREIGN KEY ("kraId") REFERENCES "KRA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRASubmission" ADD CONSTRAINT "KRASubmission_kraId_fkey" FOREIGN KEY ("kraId") REFERENCES "KRA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
