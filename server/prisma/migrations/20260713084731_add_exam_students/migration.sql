/*
  Warnings:

  - You are about to drop the column `note` on the `exam_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `exam_schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exam_schedules" DROP COLUMN "note",
DROP COLUMN "rawData",
ADD COLUMN     "credits" INTEGER,
ADD COLUMN     "examAttempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "semester" TEXT,
ALTER COLUMN "endTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "exam_students" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "classCode" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_students_studentId_idx" ON "exam_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_students_examScheduleId_studentId_key" ON "exam_students"("examScheduleId", "studentId");

-- AddForeignKey
ALTER TABLE "exam_students" ADD CONSTRAINT "exam_students_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
