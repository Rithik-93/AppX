// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function updatePositiveMarking() {
//   try {
//     const updatedExams = await prisma.exam.updateMany({
//       where: {
//         positiveMarking: 1,  // Only update exams where positiveMarking is 1
//       },
//       data: {
//         positiveMarking: 2,
//       },
//     });

//     console.log(`Updated ${updatedExams.count} exams to positiveMarking = 2`);
//   } catch (error) {
//     console.error("Error updating positiveMarking:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// updatePositiveMarking();


// import { PrismaClient } from '@prisma/client'
// import prisma from '../../../../prisma/src';

// const examAttempts = await prisma.examAttempt.findMany({
//   where: {
//     totalMarks: {
//       gt: 146.5 // greater than 146.5
//     }
//   }
// });

// console.log(examAttempts.length);


// async function recalculateTotalMarksForAllExams() {

//   const prisma = new PrismaClient()

//   try {
//     // Use a transaction to ensure atomicity
//     await prisma.$transaction(async (tx) => {
//       // Fetch all exams
//       const exams = await tx.exam.findMany()

//       // Process each exam
//       for (const exam of exams) {
//         console.log(`Processing exam: ${exam.name} (ID: ${exam.id})`)

//         // Fetch all exam attempts for this exam
//         const examAttempts = await tx.examAttempt.findMany({
//           where: { examId: exam.id },
//           include: { 
//             answers: {
//               include: { 
//                 question: true 
//               }
//             }
//           }
//         })

//         // Recalculate marks for each exam attempt
//         for (const attempt of examAttempts) {
//           let totalMarks = 0

//           for (const answer of attempt.answers) {
//             if (answer.chosenOption === null) {
//               // Unanswered question - no marks deducted
//               totalMarks += 0
//             } else if (answer.isCorrect) {
//               // Correct answer - add positive marks
//               totalMarks += exam.positiveMarking
//             } else {
//               // Incorrect answer - deduct negative marks
//               totalMarks -= exam.negativeMarking
//             }
//           }

//           // Update the exam attempt with recalculated total marks
//           await tx.examAttempt.update({
//             where: { id: attempt.id },
//             data: { totalMarks }
//           })

//           console.log(`Updated attempt ${attempt.id}: Total Marks = ${totalMarks}`)
//         }
//       }

//       console.log('Mass marks recalculation completed successfully')
//     })
//   } catch (error) {
//     console.error('Error in mass marks recalculation:', error)
//     throw error
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// // Function to run the recalculation
// async function runMassMarksRecalculation() {
//   try {
//     console.time('Marks Recalculation')
//     await recalculateTotalMarksForAllExams()
//     console.timeEnd('Marks Recalculation')
//   } catch (error) {
//     console.error('Mass marks recalculation failed:', error)
//   }
// }

// runMassMarksRecalculation()

// Export the function to be called
// export default runMassMarksRecalculation

import { createObjectCsvWriter } from 'csv-writer';
import prisma from '../../../../prisma/src'; // your prisma instance

async function exportUsersToCsv() {
  const users = await prisma.user.findMany({
    where: {
        domain: "ROJGAR"
    },
    select: {
      id: true,
      name: true,
      email: true,
      area: true,
      category: true,
      gender: true,
      phone: true
    }
  });

  const csvWriter = createObjectCsvWriter({
    path: 'rojgar_users.csv',
    header: [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'area', title: 'Area' },
      { id: 'category', title: 'Category' },
      { id: 'gender', title: 'Gender' },
      { id: 'phone', title: 'Phone' },
    ]
  });

  await csvWriter.writeRecords(users);

  console.log('CSV file was written successfully');
}

exportUsersToCsv();
