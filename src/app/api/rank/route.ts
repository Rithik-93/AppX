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
import { createUser, findUser } from "../db/user";
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

    const { answerKeyUrl, category, area, gender, state, phone } = data.data;
    console.log(answerKeyUrl, category, area, gender, state);

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

    const testCenter = examData.candidateInfo["Test Center Name"];
    const testDate = examData.candidateInfo["Test Date"];
    const testTime = examData.candidateInfo["Test Time"];
    const subject = examData.candidateInfo.Subject;
    const rollNumber = examData.candidateInfo["Roll Number"] || "N/A";
    const extractQuestionData = (): Question[] => {
      const questions: Question[] = [];

      console.error(testDate, testTime);

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

    const exam = await findExam(testDate, examData, subject);

    console.error("exam------", exam);

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

    console.error(
      "----------------------------------------------------",
      domain
    );
    //@ts-ignore
    const attempt = await findExamAttempt(domain as Domain, rollNumber, exam);

    console.error("attempt------", attempt);

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
          state,
          category: category,
          gender: gender,
          totalMarks,
        },
      });

      console.error("not reaching||||||||||||||||||||||||||||");

      let user = await prisma.user.findFirst({
        where: {
          examAttempts: {
            some: {
              rollNumber,
              examId: exam.id,
              domain: domain as Domain,
            },
          },
        },
      });

      console.error("User after upsert:", user);

      if (user) {
        console.error("inside");

        user = await prisma.user.update({
          where: {
            id: user.id,
            domain: domain as Domain,
          },
          data: {
            area,
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
              examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
            category,
            area,
            gender,
            domain: domain as Domain,
            phone,
          },
        });
      }
    } else {
      console.log(
        rollNumber,
        domain as Domain,
        exam,
        "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
      );

      // @ts-ignore
      let user = await findUser(rollNumber, domain as Domain, exam);

      console.error("user------", user);

      // Create the user if it doesn't exist
      if (!user) {
        console.error("creating userrrrrrrrrr");

        user = await createUser(
          examData,
          category,
          area,
          gender,
          domain as Domain,
          phone!
        );
      } else {
        // Update existing user if found
        console.error("reached hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        user = await prisma.user.update({
          where: {
            id: user.id,
            domain: domain as Domain,
          },
          data: {
            category,
            gender,
            area,
            phone,
          },
        });
      }

      console.error("user------", user);

      // This line needs to use the newly created user, which might be null
      // if the createUser function failed
      // if (user) {
      console.error("gotchaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
      
        const examAttempt = await createAttempt(
          //@ts-ignore
          user,
          //@ts-ignore
          exam,
          examData,
          totalMarks,
          state,
          testTime,
          category,
          domain as Domain,
          testDate,
          gender,
          area
        );
        console.error("gotchaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaddddddddddddddddd");

        if (!examAttempt) {
          // Handle the error case
          return NextResponse.json(
            {
              success: false,
              // @ts-ignore
              message: examAttempt?.message || "Failed to create exam attempt",
            },
            { status: 400 }
          );
        }

        console.error("Exam Attempt:", examAttempt);

        if (examAttempt) {
          await Promise.all(
            examData.questions.map(async (question) => {
              const questionId = extractQuestionId(question.question);
              const correctOption = question.correctAnswer.charAt(0);
              // console.log(questionId, correctOption, exam.id);

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
                    //@ts-ignore
                    userId: user.id,
                    questionId: questionId,
                    chosenOption: chosenOption,
                    isCorrect:
                      chosenOption === question.correctAnswer.charAt(0),
                    //@ts-ignore
                    examAttemptId: examAttempt.id,
                  },
                ],
              });
            })
          );
        }
      // } else {
        console.error("Failed to create user");
      // }
    }
   console.log("line 341111111111111111111111111111111111");
   
    const userRank = await getRankForUser(
      exam.id,
      rollNumber,
      state,
      gender,
      area
    );

    const avgMarks = await getAverageMarks(
      exam.id,
      category,
      testTime,
      gender,
      area
    );

    const questionStats = calculateQuestionStats(
      examData.questions,
      totalMarks
    );

    const topRankers = await getMarksAboveInfo();

    const userNormalisedRank = await getUserNormalizedRanks(
      exam.id,
      rollNumber,
      gender,
      area,
      domain as Domain
    );

    console.log(
      JSON.stringify(
        {
          fullName:
            examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
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
            stateRank: userRank.stateRank,
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
        },
        null,
        2
      )
    );

    return NextResponse.json({
      fullName: examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
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
        stateRank: userRank.stateRank,
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
    console.error("Error during scraping:", error);

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
