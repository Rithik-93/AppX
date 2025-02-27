import { ExamData } from "@/app/schema/types";
import prisma from "../../../../prisma/src";

export async function findExam(testDate: string, examData: ExamData, subject: string) {
    const exam = await prisma.exam.findUnique({
      where: {
        examDate_shiftTime_name: {
          examDate: testDate,
          shiftTime: examData.candidateInfo["Test Time"],
          name: subject,
        },
      },
      select: {
        examDate: true,
        id: true,
        examAttempts: true,
        positiveMarking: true,
        negativeMarking: true,
      },
    });

    return exam
  }