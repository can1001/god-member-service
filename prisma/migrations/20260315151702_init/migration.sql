-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('REGULAR', 'ASSOCIATE', 'YOUTH');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('MONTHLY', 'ANNUAL', 'LIFETIME');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PAID', 'UNPAID', 'EXEMPT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CMS', 'DIRECT_TRANSFER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DonorType" AS ENUM ('MEMBER', 'INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "DonationPurpose" AS ENUM ('GENERAL', 'SCHOLARSHIP', 'OPERATION', 'WELFARE', 'PROGRAM');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('SMS', 'EMAIL', 'BOTH');

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "smsConsent" BOOLEAN NOT NULL,
    "email" TEXT NOT NULL,
    "memberType" "MemberType" NOT NULL,
    "church" TEXT,
    "position" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "feeType" "FeeType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consentPrivacy" BOOLEAN NOT NULL,
    "consentMarketing" BOOLEAN NOT NULL,
    "marketingChannel" "MarketingChannel",
    "consentThirdParty" BOOLEAN NOT NULL,
    "consentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberFee" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "feeType" "FeeType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod",
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsInfo" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "holderBirthNo" TEXT NOT NULL,
    "holderPhone" TEXT NOT NULL,
    "scheduledAmount" INTEGER NOT NULL,
    "withdrawDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorType" "DonorType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "purpose" "DonationPurpose" NOT NULL,
    "note" TEXT,
    "memberId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_memberType_idx" ON "Member"("memberType");

-- CreateIndex
CREATE INDEX "Member_isActive_idx" ON "Member"("isActive");

-- CreateIndex
CREATE INDEX "Member_joinDate_idx" ON "Member"("joinDate");

-- CreateIndex
CREATE INDEX "MemberFee_year_month_idx" ON "MemberFee"("year", "month");

-- CreateIndex
CREATE INDEX "MemberFee_status_idx" ON "MemberFee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MemberFee_memberId_year_month_key" ON "MemberFee"("memberId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CmsInfo_memberId_key" ON "CmsInfo"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_receiptNo_key" ON "Donation"("receiptNo");

-- CreateIndex
CREATE INDEX "Donation_date_idx" ON "Donation"("date");

-- CreateIndex
CREATE INDEX "Donation_donorType_idx" ON "Donation"("donorType");

-- CreateIndex
CREATE INDEX "Donation_purpose_idx" ON "Donation"("purpose");

-- AddForeignKey
ALTER TABLE "MemberFee" ADD CONSTRAINT "MemberFee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsInfo" ADD CONSTRAINT "CmsInfo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
