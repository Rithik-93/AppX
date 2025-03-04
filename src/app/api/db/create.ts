import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePositiveMarking() {
  try {
    const updatedExams = await prisma.exam.updateMany({
      where: {
        positiveMarking: 1,  // Only update exams where positiveMarking is 1
      },
      data: {
        positiveMarking: 2,
      },
    });

    console.log(`Updated ${updatedExams.count} exams to positiveMarking = 2`);
  } catch (error) {
    console.error("Error updating positiveMarking:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePositiveMarking();
