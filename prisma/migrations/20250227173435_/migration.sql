/*
  Warnings:

  - A unique constraint covering the columns `[rollNumber,domain]` on the table `ExamAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_rollNumber_domain_key" ON "ExamAttempt"("rollNumber", "domain");
