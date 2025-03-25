"use server";

import prisma from "../../../../prisma/src";
import { Category, Domain } from "@prisma/client";
import { domain } from "@/app/config/config";
import { Gender, Zone } from "@/app/schema/types";

export async function getAverageMarks(
  subject: string,
  examId: string,
  category: string,
  shiftTime: string,
  gender: Gender,
  zone: Zone
) {
  // The domain variable seems to be used but not defined in the function parameters
  // Assuming it's defined elsewhere in the scope, but you may need to add it as a parameter

  // Get all aggregations in a single query using Prisma's groupBy
  const results = await prisma.examAttempt.groupBy({
    by: ["examId"],
    where: {
      examId,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
    _avg: {
      totalMarks: true,
    },
  });

  const [categoryResults, shiftResults, genderResults, areaResults] =
    await Promise.all([
      prisma.examAttempt.aggregate({
        where: {
          examId,
          domain: domain as Domain,
          category: category as Category,
          exam: {
            name: subject
          }
        },
        _avg: {
          totalMarks: true,
        },
      }),

      prisma.examAttempt.aggregate({
        where: {
          examId,
          domain: domain as Domain,
          shiftTime,
          exam: {
            name: subject
          }
        },
        _avg: {
          totalMarks: true,
        },
      }),

      prisma.examAttempt.aggregate({
        where: {
          examId,
          domain: domain as Domain,
          shiftTime,
          gender,
          exam: {
            name: subject
          }
        },
        _avg: {
          totalMarks: true,
        },
      }),

      prisma.examAttempt.aggregate({
        where: {
          examId,
          domain: domain as Domain,
          shiftTime,
          zone,
          exam: {
            name: subject
          }
        },
        _avg: {
          totalMarks: true,
        },
      }),
    ]);

  return {
    overallAverageMarks: results[0] ? results[0]._avg : { totalMarks: null },
    categoryAverageMarks: categoryResults,
    shiftAverageMarks: shiftResults,
    genderAverageMarks: genderResults,
    areaAverageMarks: areaResults,
  };
}
