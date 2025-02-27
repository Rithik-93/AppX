import { Domain, Exam } from "@prisma/client";
import prisma from "../../../../prisma/src";
import { Areas, Category, ExamData, Gender } from "@/app/schema/types";

export async function findUser(rollNumber: string, domain: Domain, exam: Exam) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        examAttempts: {
          some: {
            rollNumber,
            domain: domain as Domain,
            examId: exam.id,
          },
        },
      },
    });
  console.error('founder user', user);
  
    return user;
  } catch(e) {
    console.error(e);
    return
  }
}

export async function createUser(
  examData: ExamData,
  category: Category,
  area: Areas,
  gender: Gender,
  domain: Domain
) {
  try {
    const user = await prisma.user.create({
      data: {
        name: examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
        category,
        area,
        gender,
        domain: domain as Domain,
      },
    });
    console.error('user createdddddddd', user);
    
  
    return user;
  } catch(e) {
    console.error(e);
    return
  }
}
