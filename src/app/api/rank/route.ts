import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { load } from "cheerio";
import prisma from "../../../../prisma/src";
import { getAverageMarks } from "../actions/calculateMarks";
import { getRankForUser } from "../actions/calculateRank";
import { getMarksAboveInfo } from "../actions/rankMarks";
import { ExamData, FormSchema, Question } from "@/app/schema/types";
import { Domain } from "@prisma/client";
import { domain } from "@/app/config/config";
import { calculateMarks } from "@/app/utils/calculateMarks";
import { calculateQuestionStats } from "@/app/utils/calculateQuestionStats";
import { findExam } from "../db/exam";
import { createAttempt, findExamAttempt } from "../db/examAttempt";
// import { createUser, findUser } from "../db/user";
import { getUserNormalizedRanks } from "../normalisedRanks/overAllRank";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const data = FormSchema.safeParse(body);

    if (!data.success) {
      return NextResponse.json(
        {
          error: "Invalid data format",
        },
        {
          status: 400,
        }
      );
    }

    const { answerKeyUrl, category, zone, gender, phone, HorizontalCat } = data.data;

    let response;

    try {
      response = await axios.get(answerKeyUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
          Referer: "https://rrb.digialm.com/",
        },
      });
    } catch (e) {
      console.error(e, "Error fetching details");
    }

    if (!response) {
      return NextResponse.json({
        message: "failed to fetch details of students",
      });
    }

    const html = response.data;

    const examData: ExamData = {
      candidateInfo: {},
      questions: [],
    };

    const $ = load(html);

    $('table[border="1"] tbody tr').each((_, row) => {
      const label = $(row).find("td").first().text().trim();
      const value = $(row).find("td").last().text().trim();
      if (label && value) {
        examData.candidateInfo[label] = value;
      }
    });

    const testCenter = examData.candidateInfo["Centre Name"];
    const testDate = examData.candidateInfo["Exam Date"];
    const testTime = examData.candidateInfo["Exam Time"];
    const subject = examData.candidateInfo["Exam Name"];
    const rollNumber = examData.candidateInfo["Roll No"] || "N/A";
    const extractQuestionData = (): Question[] => {
      const questions: Question[] = [];

      // console.error(testDate, testTime);

      const questionPanels = $(
        ".question-pnl, .question-panel, .exam-question, table.questions"
      );

      questionPanels.each((index, questionPanel) => {
        const $panel = $(questionPanel);

        const question = $panel
          .find('td:contains("Q."), *:contains("Question")')
          .first()
          .text()
          .trim();
        const correctAnswer = $panel
          .find('.right-answer, td.rightAns, *:contains("Correct Answer")')
          .text()
          .trim();
        const chosenAnswer = $panel
          .find('*:contains("Chosen Option")')
          .next()
          .text()
          .trim();

        if (question) {
          questions.push({
            question,
            correctAnswer: correctAnswer || "N/A",
            chosenAnswer: chosenAnswer || "N/A",
          });
        }
      });

      return questions;
    };

    examData.questions = extractQuestionData();
    // console.error(examData.candidateInfo, '%%%%%%%%%%%%');


    if (Object.keys(examData.candidateInfo).length === 0) {
      return NextResponse.json(
        { error: "No candidate information found." },
        { status: 404 }
      );
    }

    const extractQuestionId = (questionText: string): string => {
      const match = questionText.match(/Question ID :(\d+)/);
      return match ? match[1] : " ";
    };

    // console.error(subject, testDate, '-------^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');


    const exam = await findExam(testDate, testTime, subject);

    // console.error("exam------", exam);

    if (!exam) {
      return NextResponse.json(
        {
          message: "Exam not found",
        },
        {
          status: 404,
        }
      );
    }

    const totalMarks = calculateMarks(
      examData.questions,
      exam.positiveMarking,
      exam.negativeMarking
    );

    // console.error(
    //   "----------------------------------------------------",
    //   domain
    // );
    //@ts-ignore
    const attempt = await findExamAttempt(domain as Domain, rollNumber, exam);

    // console.error("attempt------", attempt);
    // var user: User;

    if (attempt) {
      await prisma.examAttempt.update({
        where: {
          rollNumber_domain_examId: {
            rollNumber,
            domain: domain as Domain,
            examId: exam.id,
          },
        },
        data: {
          zone,
          category: category,
          gender: gender,
          totalMarks,
        },
      });

      console.log("not reaching||||||||||||||||||||||||||||");
      console.log(
        '1*****'
      )

      // try {
        console.log("Query parameters being used for findFirst:");
        console.log("rollNumber:", rollNumber);
        console.log("examId:", exam?.id);
        console.log("domain:", domain);
        let user;

        user = await prisma.user.findFirst({
          where: {
            examAttempts: {
              some: {
                rollNumber,
                examId: exam?.id,
                domain: domain as Domain,
              },
            },
          },
        });

      console.log("User after upsert:", user);

      if (user) {
        console.error("inside7777777777777777777777777777777777777777777777777777777777777");

        user = await prisma.user.update({
          where: {
            id: user.id,
            domain: domain as Domain,
          },
          data: {
            zone,
            category,
            gender,
            phone,
          },
        });
      } else {
        console.error("else++++++++++++++");
        user = await prisma.user.create({
          data: {
            name:
              examData.candidateInfo["Applicant Name"] || "Unknown Candidate",
            category,
            zone,
            gender,
            domain: domain as Domain,
            phone,
          },
        });
      }
    } else {
      // console.log(
      //   rollNumber,
      //   domain as Domain,
      //   exam,
      //   "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
      // );
      let user;

      user = await prisma.user.findFirst({
        where: {
          examAttempts: {
            some: {
              rollNumber,
              examId: exam?.id,
              domain: domain as Domain,
            },
          },
        },
      });

      if (user) {
        // console.error("inside7777777777777777777777777777777777777777777777777777777777777");

        await prisma.user.update({
          where: {
            id: user.id,
            domain: domain as Domain,
          },
          data: {
            zone,
            category,
            gender,
            phone,
          },
        });
      } else {
        console.error("else++++++++++++++");
        user = await prisma.user.create({
          data: {
            name:
              examData.candidateInfo["Applicant Name"] || "Unknown Candidate",
            category,
            zone,
            gender,
            domain: domain as Domain,
            phone,
          },
        });
      }
      // console.log('User after creation/update:', user);
      const examAttempt = await createAttempt(
        user,
        exam,
        rollNumber,
        totalMarks,
        testTime,
        category,
        domain as Domain,
        testDate,
        gender,
        zone,
        HorizontalCat
      );

      if (!examAttempt || 'error' in examAttempt) {
        return NextResponse.json(
          {
            success: false,
            message: examAttempt?.message || "Failed to create exam attempt",
          },
          { status: 400 }
        );
      }

      // Create questions and answers
      await Promise.all(
        examData.questions.map(async (question) => {
          const questionId = extractQuestionId(question.question);
          const correctOption = question.correctAnswer.charAt(0);

          await prisma.question.upsert({
            where: { questionId: questionId },
            update: { correctOption: correctOption },
            create: {
              questionId: questionId,
              correctOption: correctOption,
              examId: exam.id,
            },
          });

          const chosenOption =
            question.chosenAnswer !== "--"
              ? question.chosenAnswer
              : "Unanswered";

          await prisma.answer.createMany({
            data: [
              {
                userId: user.id,
                questionId: questionId,
                chosenOption: chosenOption,
                isCorrect:
                  chosenOption === question.correctAnswer.charAt(0),
                examAttemptId: examAttempt.id,
              },
            ],
          });
        })
      );
    }
    //  console.log("line 341111111111111111111111111111111111");

    const userRank = await getRankForUser(
      subject,
      exam.id,
      rollNumber
    );

    const avgMarks = await getAverageMarks(
      subject,
      exam.id,
      category,
      testTime,
      gender,
      zone
    );

    const questionStats = calculateQuestionStats(
      examData.questions,
      totalMarks
    );

    const topRankers = await getMarksAboveInfo(subject);

    const userNormalisedRank = await getUserNormalizedRanks(
      exam.id,
      rollNumber,
      gender,
      zone,
      domain as Domain
    );

    return NextResponse.json({
      fullName: examData.candidateInfo["Applicant Name"] || "Unknown Candidate",
      category,
      testDate,
      testTime,
      rollNumber,
      subject,
      testCenter,
      ranks: {
        overallRank: userRank.overallRank,
        categoryRank: userRank.categoryRank,
        shiftRank: userRank.shiftRank,
        genderRank: userRank.genderRank,
        areaRank: userRank.areaRank,
        // stateRank: userRank.stateRank,
        overAllNormalisedRank: userNormalisedRank?.ranks.overall,
        categoryNormalisedRank: userNormalisedRank?.ranks.category,
        shiftNormalisedRank: userNormalisedRank?.ranks.shift,
      },
      avgMarks,
      stats: {
        attempted: questionStats.attempted,
        notAttempted: questionStats.notAttempted,
        correct: questionStats.correct,
        wrong: questionStats.wrong,
        totalMarks: questionStats.totalMarks,
      },
      topRankers,
    });
  } catch (error) {
    // console.error("Error during scraping:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || "An unknown error occurred.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}

