import { Domain, ExamAttempt, Gender, Area } from "@prisma/client";
import prisma from "../../../../prisma/src";

async function calculateNormalizedRanks(examId: string, domain?: string) {
  try {
    // Build the query conditions
    const whereCondition: any = { examId };
    if (domain) {
      whereCondition.domain = domain as Domain;
    }

    const attempts = await prisma.examAttempt.findMany({
      where: whereCondition,
      include: { user: true }, // Include user to get category, gender, area information
      orderBy: { totalMarks: "desc" },
    });

    if (!attempts || attempts.length === 0) {
      console.error(`No attempts found for exam ${examId}${domain ? ` in domain ${domain}` : ''}`);
      return [];
    }

    // Group attempts by shiftTime
    const shifts = new Map<string, ExamAttempt[]>();
    for (const attempt of attempts) {
      if (!shifts.has(attempt.shiftTime)) shifts.set(attempt.shiftTime, []);
      shifts.get(attempt.shiftTime)!.push(attempt);
    }

    // Validate that we have enough data for normalization
    if (shifts.size === 0) {
      console.error("No valid shifts found in the attempts data");
      return [];
    }

    // Group attempts by category
    const categories = new Map<string, ExamAttempt[]>();
    for (const attempt of attempts) {
      const category = attempt.user?.category || "GENERAL";
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category)!.push(attempt);
    }

    // Calculate global values across all shifts
    const allMarks = attempts.map((a) => a.totalMarks);
    const globalMean = mean(allMarks);
    const globalStdDev = stdDev(allMarks, globalMean);

    const Mgq = globalMean + globalStdDev;

    // Top 0.1% global candidates
    const topGlobalCandidates = Math.max(1, Math.ceil(attempts.length * 0.001));
    const Mtg = mean(
      attempts.slice(0, topGlobalCandidates).map((a) => a.totalMarks)
    );

    // Calculate per-shift values
    const shiftStats = new Map<
      string,
      { mean: number; stdDev: number; Mt: number; Miq: number }
    >();

    // Find the shift with maximum mean
    let maxMeanShift = "";
    let maxMean = -Infinity;

    for (const [shiftTime, shiftAttempts] of shifts) {
      // Skip shifts with no attempts
      if (shiftAttempts.length === 0) {
        console.warn(`Skipping shift ${shiftTime} with no attempts`);
        continue;
      }

      const marks = shiftAttempts.map((a) => a.totalMarks);
      const shiftMean = mean(marks);
      const shiftStdDev = stdDev(marks, shiftMean);

      if (shiftMean > maxMean) {
        maxMean = shiftMean;
        maxMeanShift = shiftTime;
      }

      const Miq = shiftMean + shiftStdDev;

      // Top 0.1% in this shift
      const topShiftCandidates = Math.max(
        1,
        Math.ceil(shiftAttempts.length * 0.001)
      );
      const Mt = mean(
        shiftAttempts.slice(0, topShiftCandidates).map((a) => a.totalMarks)
      );

      shiftStats.set(shiftTime, {
        mean: shiftMean,
        stdDev: shiftStdDev,
        Mt,
        Miq,
      });
    }

    // Check if we have valid shift statistics
    if (shiftStats.size === 0 || !maxMeanShift) {
      console.error("Could not calculate shift statistics or find maximum mean shift");
      return [];
    }

    // Calculate Mqgm (mean of shift having maximum mean)
    const maxShiftStats = shiftStats.get(maxMeanShift);
    if (!maxShiftStats) {
      console.error(`Could not find statistics for maximum mean shift: ${maxMeanShift}`);
      return [];
    }
    const Mqgm = maxShiftStats.mean;

    // Apply normalization formula for each candidate
    const normalizedMarks = attempts.map((attempt) => {
      try {
        const { shiftTime, totalMarks, user } = attempt;
        
        // Validate shift data exists
        const shiftData = shiftStats.get(shiftTime);
        if (!shiftData) {
          throw new Error(`No statistics found for shift: ${shiftTime}`);
        }
        
        const { Mt, Miq } = shiftData;
        const category = user?.category || "GENERAL";
        const gender = user?.gender;
        const area = user?.area;

        // Check for division by zero
        if (Mt === Miq) {
          return {
            ...attempt,
            normalizedMark: totalMarks, // Use original marks if normalization fails
            category,
            gender,
            area,
          };
        }

        // Use the exact formula: Ṁij = ((Mtg - Mgq) / (Mti - Miq)) * (Mij - Miq) + Mqgm
        const normalizedMark =
          ((Mtg - Mgq) / (Mt - Miq)) * (totalMarks - Miq) + Mqgm;

        // Handle NaN or infinite values
        if (isNaN(normalizedMark) || !isFinite(normalizedMark)) {
          console.warn(`Invalid normalized mark for user ${attempt.userId}: ${normalizedMark}`);
          return {
            ...attempt,
            normalizedMark: totalMarks,
            category,
            gender,
            area,
          };
        }

        // Round to 5 decimal places as specified
        const roundedNormalizedMark = Math.round(normalizedMark * 100000) / 100000;

        return {
          ...attempt,
          normalizedMark: roundedNormalizedMark,
          category,
          gender,
          area,
        };
      } catch (error) {
        console.error(`Error normalizing marks for user ${attempt.userId}:`, error);
        return {
          ...attempt,
          normalizedMark: attempt.totalMarks, // Fallback to original marks
          category: attempt.user?.category || "GENERAL",
          gender: attempt.user?.gender,
          area: attempt.user?.area,
        };
      }
    });

    // Sort by normalized marks to compute normalized overall rank
    normalizedMarks.sort((a, b) => b.normalizedMark - a.normalizedMark);

    // Assign overall normalized ranks
    const rankedResults = normalizedMarks.map((attempt, index) => ({
      userId: attempt.userId,
      rollNumber: attempt.rollNumber,
      name: attempt.user?.name,
      shiftTime: attempt.shiftTime,
      category: attempt.category,
      gender: attempt.gender,
      area: attempt.area,
      originalMarks: attempt.totalMarks,
      normalizedMarks: attempt.normalizedMark,
      overallNormalizedRank: index + 1,
      categoryNormalizedRank: 0, // Will be filled in next step
      shiftNormalizedRank: 0,    // Will be filled in next step
      genderNormalizedRank: 0,   // Will be filled in separate function
      areaNormalizedRank: 0,     // Will be filled in separate function
    }));

    // Calculate category-specific ranks
    const categoryRanks = new Map<string, number>();
    for (const result of rankedResults) {
      const { category } = result;
      if (!category) continue;
      
      if (!categoryRanks.has(category)) categoryRanks.set(category, 1);
      
      result.categoryNormalizedRank = categoryRanks.get(category)!;
      categoryRanks.set(category, categoryRanks.get(category)! + 1);
    }

    // Calculate shift-specific ranks
    const shiftRanks = new Map<string, number>();
    for (const result of rankedResults) {
      const { shiftTime } = result;
      if (!shiftTime) continue;
      
      if (!shiftRanks.has(shiftTime)) shiftRanks.set(shiftTime, 1);
      
      result.shiftNormalizedRank = shiftRanks.get(shiftTime)!;
      shiftRanks.set(shiftTime, shiftRanks.get(shiftTime)! + 1);
    }

    // Calculate gender-specific ranks
    const genderRanks = new Map<Gender, number>();
    for (const result of rankedResults) {
      const { gender } = result;
      if (!gender) continue;
      
      if (!genderRanks.has(gender)) genderRanks.set(gender, 1);
      
      result.genderNormalizedRank = genderRanks.get(gender)!;
      genderRanks.set(gender, genderRanks.get(gender)! + 1);
    }

    // Calculate area-specific ranks
    const areaRanks = new Map<Area, number>();
    for (const result of rankedResults) {
      const { area } = result;
      if (!area) continue;
      
      if (!areaRanks.has(area)) areaRanks.set(area, 1);
      
      result.areaNormalizedRank = areaRanks.get(area)!;
      areaRanks.set(area, areaRanks.get(area)! + 1);
    }

    return rankedResults;
  } catch (error) {
    console.error("Error in calculateNormalizedRanks:", error);
    return [];
  }
}

async function getUserNormalizedRanks(
  examId: string, 
  rollNumber: string, 
  candidateGender: Gender, 
  candidateArea: Area,
  domain: Domain 
) {
  try {
    // First, calculate normalized ranks for all candidates
    const allNormalizedRanks = await calculateNormalizedRanks(examId, domain);
    
    if (!allNormalizedRanks || allNormalizedRanks.length === 0) {
      console.error("No normalized ranks available");
      return null;
    }
    
    // Find the specific user's ranks
    const userRanks = allNormalizedRanks.find(
      rank => rank.rollNumber === rollNumber
    );
    
    if (!userRanks) {
      console.error(`User with roll number ${rollNumber} not found in exam ${examId}`);
      return null;
    }
    
    // For efficiency, we already calculated these ranks in the main function,
    // but if they weren't calculated or parameters were passed, we can calculate them here
    let genderRank = userRanks.genderNormalizedRank;
    let areaRank = userRanks.areaNormalizedRank;
    
    // If gender was specified and doesn't match what we found, recalculate
    if (candidateGender && userRanks.gender !== candidateGender) {
      genderRank = calculateGenderRank(allNormalizedRanks, rollNumber, candidateGender);
    }
    
    // If area was specified and doesn't match what we found, recalculate
    if (candidateArea && userRanks.area !== candidateArea) {
      areaRank = calculateAreaRank(allNormalizedRanks, rollNumber, candidateArea);
    }
    
    return {
      userId: userRanks.userId,
      rollNumber,
      name: userRanks.name,
      category: userRanks.category,
      gender: userRanks.gender || candidateGender,
      area: userRanks.area || candidateArea,
      shiftTime: userRanks.shiftTime,
      totalMarks: userRanks.originalMarks,
      normalizedMarks: userRanks.normalizedMarks,
      ranks: {
        overall: userRanks.overallNormalizedRank,
        category: userRanks.categoryNormalizedRank,
        shift: userRanks.shiftNormalizedRank,
        gender: genderRank,
        area: areaRank
      }
    };
  } catch (error) {
    console.error("Error retrieving user normalized ranks:", error);
    return null;
  }
}

function calculateGenderRank(
  allNormalizedRanks: any[], 
  userRollNumber: string, 
  gender: Gender
): number {
  try {
    const sameGenderCandidates = allNormalizedRanks.filter(
      rank => rank.gender === gender
    );
    
    if (sameGenderCandidates.length === 0) {
      console.warn(`No candidates found with gender ${gender}`);
      return 0;
    }
    
    // Sort by normalized marks
    sameGenderCandidates.sort((a, b) => b.normalizedMarks - a.normalizedMarks);
    
    // Find user's position
    const position = sameGenderCandidates.findIndex(
      rank => rank.rollNumber === userRollNumber
    );
    
    return position >= 0 ? position + 1 : 0;
  } catch (error) {
    console.error("Error calculating gender rank:", error);
    return 0;
  }
}

function calculateAreaRank(
  allNormalizedRanks: any[], 
  userRollNumber: string, 
  area: Area
): number {
  try {
    // Filter candidates by area
    const sameAreaCandidates = allNormalizedRanks.filter(
      rank => rank.area === area
    );
    
    if (sameAreaCandidates.length === 0) {
      console.warn(`No candidates found from area ${area}`);
      return 0;
    }
    
    // Sort by normalized marks
    sameAreaCandidates.sort((a, b) => b.normalizedMarks - a.normalizedMarks);
    
    // Find user's position
    const position = sameAreaCandidates.findIndex(
      rank => rank.rollNumber === userRollNumber
    );
    
    return position >= 0 ? position + 1 : 0;
  } catch (error) {
    console.error("Error calculating area rank:", error);
    return 0;
  }
}

function mean(arr: number[]) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

function stdDev(arr: number[], meanValue: number) {
  if (arr.length === 0) return 0;
  const variance =
    arr.reduce((sum, x) => sum + (x - meanValue) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

async function main() {
  try {
    // Example 1: Get ranks for a specific user
    const userRanks = await getUserNormalizedRanks(
      "cm7muu0wk0000e1h8i9h51szg", // examId
      "281241170410494",                    // rollNumber
      "MALE" as Gender,            // gender (optional)
      "GENERAL" as Area,            // area (optional)
      "ROJGAR"                     // domain (optional)
    );
    
    if (userRanks) {
      console.log("User normalized ranks:");
      console.error(userRanks.ranks.gender);
    } else {
      console.log("Failed to retrieve user normalized ranks");
    }
    
    // Example 2: Calculate ranks for all candidates in an exam
    const allRanks = await calculateNormalizedRanks(
      "cm7muu0wk0000e1h8i9h51szg", // examId
      "ROJGAR"                     // domain (optional)
    );
    
    console.log(`Calculated normalized ranks for ${allRanks.length} candidates`);
    
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for use in other modules
export {
  calculateNormalizedRanks,
  getUserNormalizedRanks
};

// Uncomment to run the example:
main();