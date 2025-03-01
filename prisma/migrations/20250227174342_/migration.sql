/*
  Warnings:

  - You are about to drop the `Rank` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rollNumber,domain,examId]` on the table `ExamAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_examId_fkey";

-- DropForeignKey
ALTER TABLE "Rank" DROP CONSTRAINT "Rank_userId_fkey";

-- DropIndex
DROP INDEX "ExamAttempt_rollNumber_domain_key";

-- DropTable
DROP TABLE "Rank";

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_rollNumber_domain_examId_key" ON "ExamAttempt"("rollNumber", "domain", "examId");
