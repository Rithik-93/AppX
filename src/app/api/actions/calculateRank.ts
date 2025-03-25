// import redis from '../../../lib/redis';
// import  prisma  from '../../../../prisma/src';

// const TTL = 300;

// export const getRankForUser = async (examId: string, rollNumber: string) => {
//   const userMarks = await prisma.examAttempt.findUnique({
//     where: {  examId, rollNumber },
//     select: { totalMarks: true, shiftTime: true, category: true },
//   });

//   if (!userMarks) {
//     throw new Error('User exam attempt not found');
//   }

//   const { totalMarks, shiftTime, category } = userMarks;

//   const overallKey = `exam:${examId}:overall`;
//   const categoryKey = `exam:${examId}:category:${category}`;
//   const shiftKey = `exam:${examId}:shift:${shiftTime}`;

//   const existingOverallRanks = await redis.zcard(overallKey);

//   if (existingOverallRanks === 0) {
//     const allAttempts = await prisma.examAttempt.findMany({
//       where: { examId },
//       select: {
//         rollNumber: true,
//         totalMarks: true,
//         shiftTime: true,
//         category: true
//       }
//     });

//     const overallTransaction = redis.multi();
//     const categoryTransactions: Record<string, ReturnType<typeof redis.multi>> = {};
//     const shiftTransactions: Record<string, ReturnType<typeof redis.multi>> = {};

//     allAttempts.forEach(attempt => {
//       overallTransaction.zadd(overallKey, attempt.totalMarks, attempt.rollNumber);

//       const categoryKey = `exam:${examId}:category:${attempt.category}`;
//       if (!categoryTransactions[categoryKey]) {
//         categoryTransactions[categoryKey] = redis.multi();
//       }
//       categoryTransactions[categoryKey].zadd(categoryKey, attempt.totalMarks, attempt.rollNumber);

//       const shiftKey = `exam:${examId}:shift:${attempt.shiftTime}`;
//       if (!shiftTransactions[shiftKey]) {
//         shiftTransactions[shiftKey] = redis.multi();
//       }
//       shiftTransactions[shiftKey].zadd(shiftKey, attempt.totalMarks, attempt.rollNumber);
//     });

//     await overallTransaction.exec();
//     await Promise.all([
//       ...Object.values(categoryTransactions).map(t => t.exec()),
//       ...Object.values(shiftTransactions).map(t => t.exec())
//     ]);

//     await redis.expire(overallKey, TTL);
//     Object.keys(categoryTransactions).forEach(key => redis.expire(key, TTL));
//     Object.keys(shiftTransactions).forEach(key => redis.expire(key, TTL));
//   }

//   await redis.zadd(overallKey, totalMarks, rollNumber);
//   await redis.zadd(categoryKey, totalMarks, rollNumber);
//   await redis.zadd(shiftKey, totalMarks, rollNumber);

//   const overallRankRedis = await redis.zrevrank(overallKey, rollNumber);
//   const categoryRankRedis = await redis.zrevrank(categoryKey, rollNumber);
//   const shiftRankRedis = await redis.zrevrank(shiftKey, rollNumber);

//   const overallCandidates = await redis.zcard(overallKey);
//   const categoryCandidates = await redis.zcard(categoryKey);
//   const shiftCandidates = await redis.zcard(shiftKey);

//   return {
//     overallRank: `${overallRankRedis !== null ? overallRankRedis + 1 : 0}/${overallCandidates}`,
//     categoryRank: `${categoryRankRedis !== null ? categoryRankRedis + 1 : 0}/${categoryCandidates}`,
//     shiftRank: `${shiftRankRedis !== null ? shiftRankRedis + 1 : 0}/${shiftCandidates}`,
//   };
// };

"use server";

import { domain } from "@/app/config/config";
import prisma from "../../../../prisma/src";
import { Domain, Zone} from "@prisma/client";
import { Category, Gender } from "@/app/schema/types";

export const getRankForUser = async (
  subject: string,
  examId: string,
  rollNumber: string,
) => {

  const userMarks = await prisma.examAttempt.findUnique({
    where: {
      rollNumber_domain_examId: {
        rollNumber,
        examId,
        domain: domain as Domain,
      }
    },
  });

  if (!userMarks) {
    throw new Error("User exam attempt not found");
  }

  const { totalMarks, shiftTime, category, gender, zone } = userMarks;

  const overallRank = await getOverallRank(subject, totalMarks);
  const shiftRank = await getShiftRank(subject, examId, shiftTime, totalMarks);
  const categoryRank = await getCategoryRank(
    subject,
    examId,
    category as Category,
    totalMarks
  );
  const genderRank = await getGenderRank(subject, examId, gender as Gender, totalMarks);

  const areaRank = await getAreaRank(subject, examId, zone as Zone, totalMarks);

  // const stateRank = await getStateRank(subject, examId, state as States, totalMarks);

  const overallCandidates = await prisma.examAttempt.count({
    where: {
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
  });

  const categoryCandidates = await prisma.examAttempt.count({
    where: {
      category,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
  });

  // const stateCandidates = await prisma.examAttempt.count({
  //   where: {
  //     state,
  //     domain: domain as Domain,
  //     exam: {
  //       name: subject
  //     }
  //   },
  // });

  const shiftCandidates = await prisma.examAttempt.count({
    where: {
      shiftTime,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
  });

  const candidatesByGender = await prisma.examAttempt.count({
    where: {
      gender,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
  });

  const candidatesByZone = await prisma.examAttempt.count({
    where: {
      zone,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
  });

  return {
    overallRank: `${overallRank.rank}/${overallCandidates}`,
    shiftRank: `${shiftRank.rank}/${shiftCandidates}`,
    categoryRank: `${categoryRank.rank}/${categoryCandidates}`,
    genderRank: `${genderRank.rank}/${candidatesByGender}`,
    areaRank: `${areaRank.rank}/${candidatesByZone}`,
    // stateRank: `${stateRank.rank}/${stateCandidates}`,
  };
};

const getOverallRank = async (subject: string, userMarks: number) => {
  const scores = await prisma.examAttempt.findMany({
    where: {
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
    select: { userId: true, totalMarks: true },
  });

  const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

  let rank = 1;
  let currentRank = 1;
  let previousMarks = sortedScores[0]?.totalMarks;

  for (let i = 0; i < sortedScores.length; i++) {
    if (i > 0 && sortedScores[i].totalMarks < previousMarks) {
      currentRank = i + 1;
    }

    if (sortedScores[i].totalMarks === userMarks) {
      rank = currentRank;
    }

    previousMarks = sortedScores[i].totalMarks;
  }

  console.error(
    rank,
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
  );

  return { rank };
};

const getShiftRank = async (
  subject: string,
  examId: string,
  shiftTime: string,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: {
      shiftTime,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
    select: { userId: true, totalMarks: true },
  });

  const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

  let rank = 1;
  let currentRank = 1;
  for (let i = 0; i < sortedScores.length; i++) {
    if (i > 0 && sortedScores[i].totalMarks < sortedScores[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    if (sortedScores[i].totalMarks === userMarks) {
      rank = currentRank;
      break;
    }
  }

  return { rank };
};

const getCategoryRank = async (
  subject: string,
  examId: string,
  category: Category,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: { category: category, domain: domain as Domain, exam: { name: subject } },
    select: { userId: true, totalMarks: true },
  });

  const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

  let rank = 1;
  let currentRank = 1;
  for (let i = 0; i < sortedScores.length; i++) {
    if (i > 0 && sortedScores[i].totalMarks < sortedScores[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    if (sortedScores[i].totalMarks === userMarks) {
      rank = currentRank;
      break;
    }
  }

  return { rank };
};

const getGenderRank = async (
  subject: string,
  examId: string,
  gender: Gender,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: {
      gender,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
    select: { userId: true, totalMarks: true },
  });

  const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

  let rank = 1;
  let currentRank = 1;
  for (let i = 0; i < sortedScores.length; i++) {
    if (i > 0 && sortedScores[i].totalMarks < sortedScores[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    if (sortedScores[i].totalMarks === userMarks) {
      rank = currentRank;
      break;
    }
  }

  return { rank };
};

const getAreaRank = async (subject: string, examId: string, zone: Zone, userMarks: number) => {
  const scores = await prisma.examAttempt.findMany({
    where: {
      zone,
      domain: domain as Domain,
      exam: {
        name: subject
      }
    },
    select: { userId: true, totalMarks: true },
  });

  const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

  let rank = 1;
  let currentRank = 1;
  for (let i = 0; i < sortedScores.length; i++) {
    if (i > 0 && sortedScores[i].totalMarks < sortedScores[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    if (sortedScores[i].totalMarks === userMarks) {
      rank = currentRank;
      break;
    }
  }

  return { rank };
};

// const getStateRank = async (
//   subject: string,
//   examId: string,
//   state: States,
//   userMarks: number
// ) => {
//   const scores = await prisma.examAttempt.findMany({
//     where: { state, domain: domain as Domain, exam: {
//       name: subject
//     } },
//     select: { userId: true, totalMarks: true },
//   });

//   const sortedScores = scores.sort((a, b) => b.totalMarks - a.totalMarks);

//   let rank = 1;
//   let currentRank = 1;
//   for (let i = 0; i < sortedScores.length; i++) {
//     if (i > 0 && sortedScores[i].totalMarks < sortedScores[i - 1].totalMarks) {
//       currentRank = i + 1;
//     }
//     if (sortedScores[i].totalMarks === userMarks) {
//       rank = currentRank;
//       break;
//     }
//   }

//   return { rank };
// };

// async function main() {
//   const a = await getRankForUser("sdasdasd", "281241170410494");
//   console.log(a);
// }
// main()
