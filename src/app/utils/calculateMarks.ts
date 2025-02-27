import { Question } from "../schema/types";

export function calculateMarks(questions: Question[], positiveMarking: number, negativeMarking: number): number {
    return questions.reduce((total, question) => {
      const chosenOption = question.chosenAnswer !== '--' ? question.chosenAnswer : null;
      const isCorrect = chosenOption === question.correctAnswer.charAt(0);
  
      if (isCorrect) {
        total += positiveMarking;
      } else if (chosenOption) {
        total -= negativeMarking;
      }
  
      return total;
    }, 0);
  }
  