// import { NextResponse } from "next/server";
// import prisma from "../../../../prisma/src";
// import { getExamProps } from "@/app/types";

// export async function getExam({ testDate, examData, subject }: getExamProps) {
//     try {
//         const exam = await prisma.exam.findUnique({
//             where: {
//                 examDate_shiftTime_name: {
//                     examDate: testDate,
//                     shiftTime: examData.candidateInfo["Test Time"],
//                     name: subject,
//                 },
//             },
//             select: {
//                 examDate: true,
//                 id: true,
//                 examAttempts: true,
//                 positiveMarking: true,
//                 negativeMarking: true,
//             },
//         });

//         if (!exam) {
//             return NextResponse.json({
//                 message: "Exam not found"
//             }, {
//                 status: 404
//             });
//         }

//         return exam
//     } catch (error) {
//         throw new Error(
//             error instanceof Error ? error.message : "Error while finding the exam"
//         );
//     }

// }
