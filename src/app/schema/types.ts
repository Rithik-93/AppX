import { z } from "zod";

export interface CandidateInfo {
  [key: string]: string;
}

export interface Question {
  question: string;
  correctAnswer: string;
  chosenAnswer: string;
}

export enum Category {
  UR = "UR",
  EWS = "EWS",
  OBC = "OBC",
  SC = "SC",
  ST = "ST",
  ExSM = "ExSM",
}

export enum Languages {
  English = "ENGLISH",
  Hindi = "HINDI",
}

export enum Areas {
  General = "GENERAL",
  NexalArea = "NEXALAREA",
  BoaderArea = "BORDERAREA",
}

export interface ExamData {
  candidateInfo: CandidateInfo;
  questions: Question[];
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export const FormSchema = z.object({
  answerKeyUrl: z.string().url(),
  category: z.nativeEnum(Category),
  language: z.nativeEnum(Languages),
  area: z.nativeEnum(Areas),
  gender: z.nativeEnum(Gender),
});

export interface Question {
  question: string;
  correctAnswer: string;
  chosenAnswer: string;
}

export interface ExamData {
  candidateInfo: CandidateInfo;
  questions: Question[];
}

export interface getExamProps {
  testDate: string;
  examData: ExamData;
  subject: string;
}

export interface ScoreCardProps {
  name: string;
  category: string;
  examDate: string;
  examTime: string;
  totalMarks: number;
  //   normalizedMarks: number
  rawRank: string;
  //   normalizedRank: number
  subjectData: {
    attempted: number;
    notAttempted: number;
    correct: number;
    wrong: number;
    totalMarks: number;
  };
}

export interface MarksAboveData {
  marksAbove70: Record<string, number>;
  marksAbove65: Record<string, number>;
  marksAbove60: Record<string, number>;
  marksAbove55: Record<string, number>;
  marksAbove50: Record<string, number>;
  marksAbove45: Record<string, number>;
  marksAbove40: Record<string, number>;
  marksAbove35: Record<string, number>;
  marksAbove30: Record<string, number>;
  marksAbove20: Record<string, number>;
}

export interface StudentProps {
  fullName: string;
  category: string;
  testDate: string;
  testTime: string;
  rollNumber: string;
  subject: string;
  testCenter: string;
  ranks: {
    overallRank: string;
    categoryRank: string;
    shiftRank: string;
    genderRank: string;
    areaRank: string;
    overAllNormalisedRank: number,
    categoryNormalisedRank: number,
    shiftNormalisedRank: number
  };
  avgMarks: {
    overallAverageMarks: {
        totalMarks: number;
    };
    categoryAverageMarks: {
      _avg: {
        totalMarks: number;
      };
    };
    shiftAverageMarks: {
      _avg: {
        totalMarks: number;
      };
    };
    genderAverageMarks: {
      _avg: {
        totalMarks: number;
      };
    };
    areaAverageMarks: {
      _avg: {
        totalMarks: number | null; // Allows null values
      };
    };
  };
  stats: {
    attempted: number;
    notAttempted: number;
    correct: number;
    wrong: number;
    totalMarks: number;
  };
  topRankers: MarksAboveData;
}
