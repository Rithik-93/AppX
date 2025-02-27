import {
  Areas,
  Category,
  ExamData,
  Gender,
  Languages,
} from "@/app/schema/types";
import prisma from "../../../../prisma/src";
import { Domain, Exam, User } from "@prisma/client";

export async function findExamAttempt(
  domain: Domain,
  rollNumber: string,
  exam: Exam
) {
  const attempt = prisma.examAttempt.findUnique({
    where: {
      domain: domain as Domain,
      rollNumber,
      examId: exam.id,
    },
  });

  return attempt;
}

export async function createAttempt(
  user: User,
  exam: Exam,
  examData: ExamData,
  totalMarks: number,
  testTime: string,
  language: Languages,
  category: Category,
  domain: Domain,
  testDate: string,
  gender: Gender,
  area: Areas
) {
  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user?.id,
      examId: exam.id,
      rollNumber: examData.candidateInfo["Roll Number"] || "N/A",
      totalMarks,
      shiftTime: testTime,
      language: language,
      category: category,
      domain: domain as Domain,
      attemptDate: testDate,
      gender: gender,
      area,
    },
  });

  return attempt
}
