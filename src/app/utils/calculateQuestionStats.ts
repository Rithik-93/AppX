import { Question } from "../schema/types";

export function calculateQuestionStats(questions: Question[], totalMarks: number) {

  const stats = {
    attempted: 0,
    notAttempted: 0,
    correct: 0,
    wrong: 0,
    totalMarks: totalMarks
  };

  questions.forEach((question) => {
    const chosenOption = question.chosenAnswer !== '--' ? question.chosenAnswer : 'Unanswered';

    if (chosenOption !== 'Unanswered') {
      stats.attempted += 1;

      if (chosenOption === question.correctAnswer.charAt(0)) {
        stats.correct += 1;
      } else {
        stats.wrong += 1;
      }
    }
  });

  stats.notAttempted = questions.length - stats.attempted;

  return stats;
}