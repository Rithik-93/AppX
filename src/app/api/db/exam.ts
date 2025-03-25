import prisma from "../../../../prisma/src";

export async function findExam(
  testDate: string,
  testTime: string,
  subject: string
) {
  
  const exam = await prisma.exam.findUnique({
    where: {
      examDate_shiftTime_name: {
        examDate: testDate,
        shiftTime: testTime,
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

  return exam;
}
