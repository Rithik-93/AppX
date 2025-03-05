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
import { Domain } from "@prisma/client";
import { Areas, Category, Gender, States } from "@/app/schema/types";

export const getRankForUser = async (
  examId: string,
  rollNumber: string,
  userState: States,
  CandidateGender: Gender,
  CandidatAerea: Areas
) => {
  console.log(
    rollNumber,
    examId,
    domain,
    CandidateGender,
    CandidatAerea,
    "**************************************"
  );

  const userMarks = await prisma.examAttempt.findUnique({
    where: {
      rollNumber_domain_examId: {
        rollNumber,
        examId,
        domain: domain as Domain,
      },
      state: userState,
    },
  });

  if (!userMarks) {
    throw new Error("User exam attempt not found");
  }

  const { totalMarks, shiftTime, category, gender, area, state } = userMarks;

  const overallRank = await getOverallRank(totalMarks);
  const shiftRank = await getShiftRank(examId, shiftTime, totalMarks);
  const categoryRank = await getCategoryRank(
    examId,
    category as Category,
    totalMarks
  );
  const genderRank = await getGenderRank(examId, gender as Gender, totalMarks);

  const areaRank = await getAreaRank(examId, area as Areas, totalMarks);

  const stateRank = await getStateRank(examId, state as States, totalMarks);

  const overallCandidates = await prisma.examAttempt.count({
    where: {
      domain: domain as Domain,
    },
  });

  const categoryCandidates = await prisma.examAttempt.count({
    where: {
      category,
      domain: domain as Domain,
    },
  });

  const stateCandidates = await prisma.examAttempt.count({
    where: {
      state,
      domain: domain as Domain,
    },
  });

  const shiftCandidates = await prisma.examAttempt.count({
    where: {
      shiftTime,
      domain: domain as Domain,
    },
  });

  const candidatesByGender = await prisma.examAttempt.count({
    where: {
      gender,
      domain: domain as Domain,
    },
  });

  const candidatesByArea = await prisma.examAttempt.count({
    where: {
      area,
      domain: domain as Domain,
    },
  });

  return {
    overallRank: `${overallRank.rank}/${overallCandidates}`,
    shiftRank: `${shiftRank.rank}/${shiftCandidates}`,
    categoryRank: `${categoryRank.rank}/${categoryCandidates}`,
    genderRank: `${genderRank.rank}/${candidatesByGender}`,
    areaRank: `${areaRank.rank}/${candidatesByArea}`,
    stateRank: `${stateRank.rank}/${stateCandidates}`,
  };
};

const getOverallRank = async (userMarks: number) => {
  const scores = await prisma.examAttempt.findMany({
    where: { domain: domain as Domain },
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
  examId: string,
  shiftTime: string,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: { shiftTime, domain: domain as Domain },
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
  examId: string,
  category: Category,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: { category: category as Category, domain: domain as Domain },
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
  examId: string,
  gender: Gender,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: { gender, domain: domain as Domain },
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

const getAreaRank = async (examId: string, area: Areas, userMarks: number) => {
  const scores = await prisma.examAttempt.findMany({
    where: { area, domain: domain as Domain },
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

const getStateRank = async (
  examId: string,
  state: States,
  userMarks: number
) => {
  const scores = await prisma.examAttempt.findMany({
    where: { state, domain: domain as Domain },
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

// async function main() {
//   const a = await getRankForUser("sdasdasd", "281241170410494");
//   console.log(a);
// }
// main()
