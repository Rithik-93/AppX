import { Category, Gender, Zone } from "@/app/schema/types";
import prisma from "../../../../prisma/src";
import { Domain, Exam, HorizontalCat, User } from "@prisma/client";

export async function findExamAttempt(
  domain: Domain,
  rollNumber: string,
  exam: Exam
) {
  const attempt = await prisma.examAttempt.findUnique({
    where: {
      rollNumber_domain_examId: {
        domain: domain as Domain,
        rollNumber,
        examId: exam.id,
      },
    },
  });

  return attempt;
}

export async function createAttempt(
  user: User,
  exam: { id: string },
  rollNumber: string,
  totalMarks: number,
  testTime: string,
  category: Category,
  domain: Domain,
  testDate: string,
  gender: Gender,
  zone: Zone,
  HorizontalCat: HorizontalCat
) {
  try {
    // console.log("hereee*******************************ee",
    //   user.id,exam.id,rollNumber, totalMarks,state,testTime,category,domain,testDate,gender,area
    // );
    
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: user?.id,
        examId: exam.id,
        rollNumber,
        totalMarks,
        shiftTime: testTime,
        category: category,
        domain: domain as Domain,
        attemptDate: testDate,
        gender: gender,
        zone,
        HorizontalCat
      },
    });

    return attempt;
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error creating exam attempt:", e);
      return { error: true, message: e.message };
    } else {
      console.error("Unknown error creating exam attempt:", e);
      return { error: true, message: "Unknown error" };
    }
  }
}
