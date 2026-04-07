-- Phase 4: Labor Marketplace
-- CreateTable: labor_teams
CREATE TABLE "labor_teams" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "skills" TEXT[],
    "primarySkill" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "baseLocation" JSONB NOT NULL,
    "serviceRadius" INTEGER NOT NULL DEFAULT 30,
    "dailyRatePerWorker" DOUBLE PRECISION NOT NULL,
    "minimumWorkers" INTEGER NOT NULL DEFAULT 1,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable: team_members
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "aadhaarLast4" TEXT,
    "photo" TEXT,
    "skills" TEXT[],
    "experience" INTEGER,
    "preferredCrops" TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "unavailableFrom" TIMESTAMP(3),
    "unavailableTo" TIMESTAMP(3),
    "unavailableReason" TEXT,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "bankAccountName" TEXT,
    "upiId" TEXT,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: job_postings
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "skillRequired" TEXT NOT NULL,
    "workersNeeded" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysNeeded" INTEGER NOT NULL,
    "slotType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "farmLocation" JSONB NOT NULL,
    "farmSize" DOUBLE PRECISION,
    "cropType" TEXT,
    "budgetPerWorkerPerDay" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedBidId" TEXT,
    "assignedTeamId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bids
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "teamId" TEXT,
    "providerId" TEXT NOT NULL,
    "ratePerWorkerPerDay" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "workersOffered" INTEGER NOT NULL,
    "message" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable: attendance
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "teamMemberId" TEXT,
    "workerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkInDistance" DOUBLE PRECISION,
    "checkInQrCode" TEXT,
    "checkInPhoto" TEXT,
    "checkInVerified" BOOLEAN NOT NULL DEFAULT false,
    "checkOutTime" TIMESTAMP(3),
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "checkOutDistance" DOUBLE PRECISION,
    "checkOutQrCode" TEXT,
    "checkOutPhoto" TEXT,
    "checkOutVerified" BOOLEAN NOT NULL DEFAULT false,
    "hoursWorked" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION,
    "breakMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ABSENT',
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "substitutedFor" TEXT,
    "dailyAmount" DOUBLE PRECISION,
    "overtimeAmount" DOUBLE PRECISION,
    "deductions" DOUBLE PRECISION,
    "netAmount" DOUBLE PRECISION,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "labor_teams_leaderId_idx" ON "labor_teams"("leaderId");
CREATE INDEX "team_members_teamId_isAvailable_idx" ON "team_members"("teamId", "isAvailable");
CREATE INDEX "job_postings_status_skillRequired_idx" ON "job_postings"("status", "skillRequired");
CREATE INDEX "job_postings_farmerId_status_idx" ON "job_postings"("farmerId", "status");
CREATE UNIQUE INDEX "job_postings_assignedBidId_key" ON "job_postings"("assignedBidId");
CREATE UNIQUE INDEX "bids_jobPostingId_providerId_key" ON "bids"("jobPostingId", "providerId");
CREATE INDEX "bids_jobPostingId_status_idx" ON "bids"("jobPostingId", "status");
CREATE UNIQUE INDEX "attendance_bookingId_workerId_date_key" ON "attendance"("bookingId", "workerId", "date");
CREATE INDEX "attendance_bookingId_date_idx" ON "attendance"("bookingId", "date");
CREATE INDEX "attendance_teamMemberId_date_idx" ON "attendance"("teamMemberId", "date");

-- AddForeignKey
ALTER TABLE "labor_teams" ADD CONSTRAINT "labor_teams_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "labor_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_assignedBidId_fkey" FOREIGN KEY ("assignedBidId") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "labor_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
