// import prisma from '../../../../prisma/src';
// import redis from '@/lib/redis';

// const CACHE_EXPIRATION = 10;

// type MarksAboveData = {
//   [key: string]: Record<string, number>;
// };

// export async function getMarksAboveInfo(): Promise<MarksAboveData> {
//   const marksAboveData: MarksAboveData = {};

//   const ranges = [
//     { range: '70', filter: { totalMarks: { gt: 70 } } },
//     { range: '65', filter: { totalMarks: { gt: 65 } } },
//     { range: '60', filter: { totalMarks: { gt: 60 } } },
//     { range: '55', filter: { totalMarks: { gt: 55 } } },
//     { range: '50', filter: { totalMarks: { gt: 50 } } },
//     { range: '45', filter: { totalMarks: { gt: 45 } } },
//     { range: '40', filter: { totalMarks: { gt: 40 } } },
//     { range: '35', filter: { totalMarks: { gt: 35 } } },
//     { range: '30', filter: { totalMarks: { gt: 30 } } },
//     { range: '20', filter: { totalMarks: { gt: 20 } } },
//   ];

//   for (const { range, filter } of ranges) {
//     const cachedData = await redis.get(`marksAbove${range}`);

//     if (cachedData) {
//       marksAboveData[`marksAbove${range}`] = JSON.parse(cachedData);
//     } else {
//       const data = await prisma.examAttempt.findMany({
//         where: filter,
//         select: {
//           category: true,
//         },
//       });

//       const categoryCount = data.reduce((acc, { category }) => {
//         acc[category] = (acc[category] || 0) + 1;
//         return acc;
//       }, {} as Record<string, number>);

//       marksAboveData[`marksAbove${range}`] = categoryCount;

//       await redis.setex(`marksAbove${range}`, CACHE_EXPIRATION, JSON.stringify(categoryCount));
//     }
//   }

//   return marksAboveData;
// }
'use server'

import { domain } from '@/app/config/config';
import prisma from '../../../../prisma/src';
import { Domain } from '@prisma/client';

type MarksAboveData = {
  [key: string]: Record<string, number>;
};

export async function getMarksAboveInfo(subject: string): Promise<MarksAboveData> {
  const marksAboveData: MarksAboveData = {};

  const ranges = [
    {
      range: '70', filter: {
        totalMarks: { gt: 70 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '65', filter: {
        totalMarks: { gt: 65 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '60', filter: {
        totalMarks: { gt: 60 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '55', filter: {
        totalMarks: { gt: 55 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '50', filter: {
        totalMarks: { gt: 50 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '45', filter: {
        totalMarks: { gt: 45 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '40', filter: {
        totalMarks: { gt: 40 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '35', filter: {
        totalMarks: { gt: 35 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '30', filter: {
        totalMarks: { gt: 30 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
    {
      range: '20', filter: {
        totalMarks: { gt: 20 }, domain: domain as Domain,
        exam: {
          name: subject
        }
      }
    },
  ];

  for (const { range, filter } of ranges) {
    const data = await prisma.examAttempt.findMany({
      where: filter,
      select: {
        category: true,
      },
    });

    const categoryCount = data.reduce((acc, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    marksAboveData[`marksAbove${range}`] = categoryCount;
  }

  return marksAboveData;
}
