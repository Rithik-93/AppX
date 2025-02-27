import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baseExam = {
    name: "ALP Stage 1",
    negativeMarking: 0.25,
    positiveMarking: 5,
  };

  const dates = [
    "2025-02-04", "2025-02-05", "2025-02-06", "2025-02-07",
    "2025-02-08", "2025-02-09", "2025-02-10", "2025-02-11",
    "2025-02-12", "2025-02-13", "2025-02-17", "2025-02-18",
    "2025-02-19", "2025-02-20", "2025-02-21", "2025-02-24", "2025-02-25"
  ];

  const shifts = [
    "9:00 AM - 10:00 AM",
    "11:45 AM - 12:45 PM",
    "2:30 PM - 3:30 PM",
    "5:15 PM - 6:15 PM"
  ];

  const examsToCreate = [];

  for (const date of dates) {
    for (const shift of shifts) {
      examsToCreate.push({
        ...baseExam,
        examDate: date,
        shiftTime: shift,
      });
    }
  }

  try {
    const createdExams = await prisma.exam.createMany({
      data: examsToCreate,
    });

    console.log(`Successfully added ${createdExams.count} exams.`);
  } catch (error) {
    console.error("Error adding exams:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
