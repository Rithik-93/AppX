export interface CandidateInfo {
  [key: string]: string;
}

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
    subject: string
}

export interface ScoreCardProps {
    name: string
    category: string
    examDate: string
    examTime: string
    totalMarks: number
    //   normalizedMarks: number
    rawRank: number
    //   normalizedRank: number
    subjectData: {
        attempted: number
        notAttempted: number
        correct: number
        wrong: number
        totalMarks: number
    }
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
  fullName: string
  category: string
  testDate: string
  testTime: string
  rollNumber: string
  subject: string
  testCenter: string
  ranks: {
    overallRank: number
    categoryRank: number
    shiftRank: number
  }
  avgMarks: {
    overallAverageMarks: {
      _avg: {
        totalMarks: number
      }
    },
    categoryAverageMarks: {
      _avg: {
        totalMarks: number
      }
    },
    shiftAverageMarks: {
      _avg: {
        totalMarks: number
      }
    }
  }
  stats: {
    attempted: number
    notAttempted: number
    correct: number
    wrong: number
    totalMarks: number
  },
  topRankers: MarksAboveData
}