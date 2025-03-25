-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'HINDI');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('UR', 'EWS', 'OBC', 'SC', 'ST');

-- CreateEnum
CREATE TYPE "HorizontalCat" AS ENUM ('EXSM', 'OH', 'VH', 'HH', 'OtherPWD');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('JAMMU_SRINAGAR', 'KOLKATA', 'MALDA', 'MUMBAI', 'MUZAFFARPUR', 'PATNA', 'PRAYAGRAJ', 'RANCHI', 'SECUNDERABAD', 'SILIGURI', 'THIRUVANANTHAPURAM', 'AHMEDABAD', 'AJMER', 'BANGALORE', 'BHOPAL', 'BHUBANESWAR', 'BILASPUR', 'CHANDIGARH', 'CHENNAI', 'GORAKHPUR', 'GUWAHATI');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('ROJGAR', 'SCIENCEMAGNET');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "domain" "Domain" NOT NULL,
    "category" "Category" NOT NULL,
    "area" "Area" NOT NULL,
    "phone" TEXT,
    "gender" "Gender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "shiftTime" TEXT NOT NULL,
    "negativeMarking" DOUBLE PRECISION NOT NULL,
    "positiveMarking" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "questionId" TEXT NOT NULL,
    "examAttemptId" TEXT NOT NULL,
    "chosenOption" TEXT,
    "isCorrect" BOOLEAN,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "examId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "HorizontalCat" "HorizontalCat" NOT NULL,
    "shiftTime" TEXT NOT NULL,
    "attemptDate" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "zone" "Area" NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "gender" "Gender" NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examDate_shiftTime_name_key" ON "Exam"("examDate", "shiftTime", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Question_questionId_key" ON "Question"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_rollNumber_domain_examId_key" ON "ExamAttempt"("rollNumber", "domain", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_userId_examId_domain_key" ON "ExamAttempt"("userId", "examId", "domain");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("questionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "ExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
