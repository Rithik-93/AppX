import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import prisma from '../../../../prisma/src';
import { calculateMarks, getAverageMarks } from '../actions/calculateMarks';
import { getRankForUser } from '../actions/calculateRank';
import { calculateQuestionStats } from '../actions/calculateQStats';
import { getMarksAboveInfo } from '../actions/rankMarks';

interface CandidateInfo {
  [key: string]: string;
}

export interface Question {
  question: string;
  correctAnswer: string;
  chosenAnswer: string;
}

interface ExamData {
  candidateInfo: CandidateInfo;
  questions: Question[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { answerKeyUrl, category, language, horizontalCat } = body;
    if (!answerKeyUrl || !category || !language) {
      return NextResponse.json(
        {
          error: 'url, language and category is required in the request body'
        },
        {
          status: 400
        }
      );
    }

    let response;

    try {
      response = await axios.get(answerKeyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://rrb.digialm.com/',
        }
      });
    } catch (e) {
      console.error(e, "Error fetching details")
    }

    if (!response) {
      return NextResponse.json({
        message: "failed to fetch details of students"
      })
      
    }

    const html = response.data;

    const examData: ExamData = {
      candidateInfo: {},
      questions: [],
    };

    const $ = load(html);

    $('table[border="1"] tbody tr').each((_, row) => {
      const label = $(row).find('td').first().text().trim();
      const value = $(row).find('td').last().text().trim();
      if (label && value) {
        examData.candidateInfo[label] = value;
      }
    });

    const testCenter = examData.candidateInfo['Test Center Name'];
    const testDate = examData.candidateInfo['Test Date'];
    const testTime = examData.candidateInfo['Test Time'];
    const subject = examData.candidateInfo.Subject;
    const rollNumber = examData.candidateInfo['Roll Number'] || 'N/A'

    console.log(testCenter, testDate, testTime, subject, rollNumber);

    const extractQuestionData = (): Question[] => {
      const questions: Question[] = [];

      const questionPanels = $('.question-pnl, .question-panel, .exam-question, table.questions');

      questionPanels.each((index, questionPanel) => {
        const $panel = $(questionPanel);

        const question = $panel.find('td:contains("Q."), *:contains("Question")').first().text().trim();
        const correctAnswer = $panel.find('.right-answer, td.rightAns, *:contains("Correct Answer")').text().trim();
        const chosenAnswer = $panel.find('*:contains("Chosen Option")').next().text().trim();

        if (question) {
          questions.push({
            question,
            correctAnswer: correctAnswer || 'N/A',
            chosenAnswer: chosenAnswer || 'N/A',
          });
        }
      });

      return questions;
    };

    examData.questions = extractQuestionData();
    console.log(examData);

    if (Object.keys(examData.candidateInfo).length === 0) {
      return NextResponse.json({ error: 'No candidate information found.' }, { status: 404 });
    }

    const extractQuestionId = (questionText: string): string => {
      const match = questionText.match(/Question ID :(\d+)/);
      return match ? match[1] : ' ';
    };

    const exam = await prisma.exam.findUnique({
      where: {
        examDate_shiftTime_name: {
          examDate: testDate,
          shiftTime: examData.candidateInfo["Test Time"],
          name: subject,
        },
      },
      select: {
        examDate: true,
        id: true,
        examAttempts: true,
        positiveMarking: true,
        negativeMarking: true,
      },
    });

    if (!exam) {
      return NextResponse.json({
        message: "Exam not found"
      }, {
        status: 404
      });
    }

    const totalMarks = calculateMarks(examData.questions, exam.positiveMarking, exam.negativeMarking);

    const attempt = await prisma.examAttempt.findUnique({
      where: {
        rollNumber,
        examId: exam.id
      }
    });

    if (attempt) {
      await prisma.examAttempt.update({
        where: {
          rollNumber,
          examId: exam.id
        },
        data: {
          language,
          category,
          horizontalCategory: horizontalCat
        }
      });

      let user = await prisma.user.findFirst({
        where: {
          examAttempts: {
            some: {
              rollNumber,
              examId: exam.id,
            },
          },
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            category,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
            category,
          },
        });
      }

    } else {
      let user = await prisma.user.findFirst({
        where: {
          examAttempts: {
            some: {
              rollNumber,
              examId: exam.id,
            },
          },
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            category,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: examData.candidateInfo["Candidate Name"] || "Unknown Candidate",
            category,
          },
        });
      }

      const examAttempt = await prisma.examAttempt.create({
        data: {
          userId: user?.id,
          examId: exam.id,
          rollNumber: examData.candidateInfo["Roll Number"] || 'N/A',
          totalMarks: totalMarks,
          shiftTime: testTime,
          language,
          category,
          attemptDate: testDate,
          horizontalCategory: horizontalCat
        }
      });

      await Promise.all(
        examData.questions.map(async (question) => {
          const questionId = extractQuestionId(question.question);
          const correctOption = question.correctAnswer.charAt(0);

          await prisma.question.upsert({
            where: { questionId: questionId },
            update: { correctOption: correctOption },
            create: { questionId: questionId, correctOption: correctOption, examId: exam.id }
          });

          const chosenOption = question.chosenAnswer !== '--' ? question.chosenAnswer : 'Unanswered';

          await prisma.answer.createMany({
            data: [{
              userId: user?.id,
              questionId: questionId,
              chosenOption: chosenOption,
              isCorrect: chosenOption === question.correctAnswer.charAt(0),
              examAttemptId: examAttempt.id,
            }]
          });
        })
      );
    }

    const userRank = await getRankForUser(exam.id, rollNumber);
    const avgMarks = await getAverageMarks(exam.id, category, testTime);
    const questionStats = calculateQuestionStats(examData.questions, totalMarks);
    const topRankers = await getMarksAboveInfo()

    return NextResponse.json(
      {
        fullName: examData.candidateInfo['Candidate Name'] || 'Unknown Candidate',
        category,
        testDate,
        testTime,
        rollNumber,
        subject,
        testCenter,
        ranks: {
          overallRank: userRank.overallRank,
          categoryRank: userRank.categoryRank,
          shiftRank: userRank.shiftRank
        },
        avgMarks,
        stats: {
          attempted: questionStats.attempted,
          notAttempted: questionStats.notAttempted,
          correct: questionStats.correct,
          wrong: questionStats.wrong,
          totalMarks: questionStats.totalMarks
        },
        topRankers
      }
    );

  } catch (error) {
    console.error('Error during scraping:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message || 'An unknown error occurred.'
        },
        {
          status: 500
        }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred.'
      },
      {
        status: 500
      }
    );
  }
}
