// import { PrismaClient } from '@prisma/client';

import prisma from "../../../../prisma/src";

// const prisma = new PrismaClient();

// async function main() {
//   const baseExam = {
//     name: "ALP Stage 1",
//     negativeMarking: 0.25,
//     positiveMarking: 2,
//   };

//   const dates = [
//     "2025-02-04", "2025-02-05", "2025-02-06", "2025-02-07",
//     "2025-02-08", "2025-02-09", "2025-02-10", "2025-02-11",
//     "2025-02-12", "2025-02-13", "2025-02-17", "2025-02-18",
//     "2025-02-19", "2025-02-20", "2025-02-21", "2025-02-24", "2025-02-25"
//   ];

//   const shifts = [
//     "9:00 AM - 10:00 AM",
//     "11:45 AM - 12:45 PM",
//     "2:30 PM - 3:30 PM",
//     "5:15 PM - 6:15 PM"
//   ];

//   const examsToCreate = [];

//   for (const date of dates) {
//     const formattedDate = new Date(date).toLocaleDateString("en-GB");
//     for (const shift of shifts) {
//       examsToCreate.push({
//         ...baseExam,
//         examDate: formattedDate,
//         shiftTime: shift,
//       });
//     }
//   }

//   try {
//     const createdExams = await prisma.exam.createMany({
//       data: examsToCreate,
//     });

//     console.log(`Successfully added ${createdExams.count} exams.`);
//   } catch (error) {
//     console.error("Error adding exams:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main();


const attempt = await prisma.examAttempt.create({
    data: {
      userId: "cm7q2do5d000fe1mkdndjwgaf",  // Make sure `user?.id` exists or hardcode for testing
      examId: "cm7nfqgn10000e19g1eubj0q5",
      rollNumber: "281241170410494",
      totalMarks: 281,
      state: "BIHAR",
      shiftTime: "12:30 PM - 1:30 PM",
      category: "EWS",
      domain: "SCIENCEMAGNET",
      attemptDate: '26/11/2024',  // Format as ISO Date
      gender: "FEMALE",
      area: "NEXALAREA"
    },
  });

  console.log(attempt);
  
  