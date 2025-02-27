

import { Area, Category, Domain, Gender } from "@prisma/client";
import prisma from "../../../../prisma/src";

// async function findUser() {
//     try {
//         const a = await prisma.user.findFirst({
//             where: {
//                 examAttempts: {
//                     some: {
//                         area: Area.GENERAL,
//                         category: Category.UR,
//                         domain: Domain.ROJGAR
//                     }
//                 }
//             }
//         });

//         if (a) {
//             console.log(a);
//         } else {
//             console.log("No user found");
//         }
//     } catch (e) {
//         console.error("Error fetching user:", e);
//     }
// }

// findUser();



// const user = await prisma.user.findFirst({
//     include: { examAttempts: true },
// });
// console.log(JSON.stringify(user, null, 2));

const userMarks = await prisma.examAttempt.findUnique({
    where: {
      rollNumber: '281241170410494',
      examId: 'asd^%&DAGDyr',
      domain: "ROJGAR" as Domain,
      gender: "FEMALE" as Gender,
      area: "BORDERAREA" as Area,
    },
  });

  console.error(userMarks);
  


// 281241170410494 asd^%&DAGDyr ROJGAR FEMALE BORDERAREA