import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import prisma from '../../../../prisma/src';
import { calculateMarks, getAverageMarks } from '../actions/calculateMarks';
import { getRankForUser } from '../actions/calculateRank';

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

    const { answerKeyUrl, zone, category } = body;
    if (!answerKeyUrl || !zone || !category) {
      return NextResponse.json(
        {
          error: 'url, zone and category is required in the request body'
        },
        {
          status: 400
        }
      );
    }

    const response = await axios.get(answerKeyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

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

    const extractQuestionData = (): Question[] => {
      const questions: Question[] = [];

      // Multiple selector strategies
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

    if (Object.keys(examData.candidateInfo).length === 0) {
      return NextResponse.json({ error: 'No candidate information found.' }, { status: 404 });
    }

    const extractQuestionId = (questionText: string): string => {
      const match = questionText.match(/Question ID :(\d+)/);
      return match ? match[1] : '';
    };

    const user = await prisma.user.create({
      data: {
        name: examData.candidateInfo['Candidate Name'] || 'Unknown Candidate',
        category
      }
    });

    // const exam = await prisma.exam.create({
    //   data: {
    //     name: "Sample Examl",
    //     examDate: new Date(),
    //     negativeMarking: 0.4,
    //     positiveMarking: 4
    //   },
    // });

    const exam = await prisma.exam.findUnique({
      where: {
        shiftTime: examData.candidateInfo["Test Time"]
      },
      select: {
        examDate: true,
        id: true,
        examAttempts: true,
        positiveMarking: true,
        negativeMarking: true,

      }
    })

    if (!exam) {
      return NextResponse.json({
        message: "Exam not found"
      },{
        status: 404
      })
    }

    await Promise.all(
      examData.questions.map(async (question) => {
        const questionId = extractQuestionId(question.question);
        const correctOption = question.correctAnswer.charAt(0);

        await prisma.question.upsert({
          where: { questionId: questionId },
          update: {
            correctOption: correctOption,
          },
          create: {
            questionId: questionId,
            correctOption: correctOption,
            examId: exam.id
          },
        });
      })
    );

    const totalMarks = calculateMarks(examData.questions, exam.positiveMarking, exam.negativeMarking);

    const examAttempt = await prisma.examAttempt.create({
      data: {
        userId: user.id,
        examId: exam.id,
        rollNumber: examData.candidateInfo["Roll Number"] || 'N/A',
        totalMarks: totalMarks,
        zone,
        shiftTime: testTime,
        category
      },
    });

    await prisma.answer.createMany({
      data: examData.questions.map((question) => {
        const questionId = extractQuestionId(question.question);
        const chosenOption = question.chosenAnswer !== '--' ? question.chosenAnswer : 'Unanswered';

        return {
          userId: user.id,
          questionId: questionId,
          chosenOption: chosenOption,
          isCorrect: chosenOption === question.correctAnswer.charAt(0),
          examAttemptId: examAttempt.id,
        };
      }),
    });

    const userRank = await getRankForUser(exam.id, user.id);
    const avgMarks = await getAverageMarks(exam.id, category, testTime)

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
        avgMarks
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