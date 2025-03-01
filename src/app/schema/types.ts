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

export enum States {
  ANDHRAPRADESH = "ANDHRAPRADESH",
  ARUNACHALPRADESH = "ARUNACHALPRADESH",
  ASSAM = "ASSAM",
  BIHAR = "BIHAR",
  CHHATTISGARH = "CHHATTISGARH",
  GOA = "GOA",
  GUJARAT = "GUJARAT",
  HARYANA = "HARYANA",
  HIMACHALPRADESH = "HIMACHALPRADESH",
  JHARKHAND = "JHARKHAND",
  KARNATAKA = "KARNATAKA",
  KERALA = "KERALA",
  MADHYAPRADESH = "MADHYAPRADESH",
  MAHARASHTRA = "MAHARASHTRA",
  MANIPUR = "MANIPUR",
  MEGHALAYA = "MEGHALAYA",
  MIZORAM = "MIZORAM",
  NAGALAND = "NAGALAND",
  ODISHA = "ODISHA",
  PUNJAB = "PUNJAB",
  RAJASTHAN = "RAJASTHAN",
  SIKKIM = "SIKKIM",
  TAMILNADU = "TAMILNADU",
  TELANGANA = "TELANGANA",
  TRIPURA = "TRIPURA",
  UTTARPRADESH = "UTTARPRADESH",
  UTTARAKHAND = "UTTARAKHAND",
  WESTBENGAL = "WESTBENGAL",
  ANDAMAN_AND_NICOBAR_ISLANDS = "ANDAMAN_AND_NICOBAR_ISLANDS",
  CHANDIGARH = "CHANDIGARH",
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = "DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU",
  DELHI = "DELHI",
  LAKSHADWEEP = "LAKSHADWEEP",
  PUDUCHERRY = "PUDUCHERRY",
  LADAKH = "LADAKH",
  JAMMU_AND_KASHMIR = "JAMMU_AND_KASHMIR",
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
  area: z.nativeEnum(Areas),
  state: z.nativeEnum(States),
  gender: z.nativeEnum(Gender),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),
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
    stateRank: string;
    overAllNormalisedRank: number;
    categoryNormalisedRank: number;
    shiftNormalisedRank: number;
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
