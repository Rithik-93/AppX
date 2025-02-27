/*
  Warnings:

  - A unique constraint covering the columns `[rollNumber]` on the table `ExamAttempt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,examId,domain]` on the table `ExamAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ExamAttempt_userId_examId_domain_rollNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_rollNumber_key" ON "ExamAttempt"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_userId_examId_domain_key" ON "ExamAttempt"("userId", "examId", "domain");
