// // Sample data simulation for SSC exam normalization
// // Let's create sample data for two shifts

// // Define our test data structure
// type Candidate = {
//     id: string;
//     shift: "Morning" | "Evening";
//     marks: number;
//   };
  
//   // Sample data with 50 candidates per shift
//   const generateShiftData = (shift: "Morning" | "Evening", meanMarks: number, stdDev: number): Candidate[] => {
//     const candidates: Candidate[] = [];
//     for (let i = 1; i <= 50; i++) {
//       // Generate random mark with normal-ish distribution around the mean
//       const randomFactor = Math.random() * 2 - 1; // Between -1 and 1
//       let mark = meanMarks + randomFactor * stdDev;
//       // Ensure mark is between 0 and 100
//       mark = Math.min(100, Math.max(0, mark));
//       mark = Math.round(mark * 100) / 100; // Round to 2 decimal places
      
//       candidates.push({
//         id: `${shift.charAt(0)}${i}`,
//         shift,
//         marks: mark
//       });
//     }
    
//     // Sort by marks in descending order
//     return candidates.sort((a, b) => b.marks - a.marks);
//   };
  
//   // Generate candidates data with different difficulty levels
//   // Morning shift is easier (higher mean)
//   const morningCandidates = generateShiftData("Morning", 75, 15);
//   // Evening shift is harder (lower mean)
//   const eveningCandidates = generateShiftData("Evening", 65, 15);
  
//   // Combine all candidates
//   const allCandidates = [...morningCandidates, ...eveningCandidates];
//   allCandidates.sort((a, b) => b.marks - a.marks);
  
//   // Calculate statistics
//   function mean(marks: number[]): number {
//     return marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
//   }
  
//   function stdDev(marks: number[], meanValue: number): number {
//     const variance = marks.reduce((sum, mark) => sum + Math.pow(mark - meanValue, 2), 0) / marks.length;
//     return Math.sqrt(variance);
//   }
  
//   // Group by shift
//   const morningMarks = morningCandidates.map(c => c.marks);
//   const eveningMarks = eveningCandidates.map(c => c.marks);
//   const allMarks = allCandidates.map(c => c.marks);
  
//   // Calculate global statistics
//   const globalMean = mean(allMarks);
//   const globalStdDev = stdDev(allMarks, globalMean);
//   const Mgq = globalMean + globalStdDev;
  
//   // Calculate top 0.1% global (at least 1)
//   const topGlobalCount = Math.max(1, Math.ceil(allCandidates.length * 0.001));
//   const Mtg = mean(allCandidates.slice(0, topGlobalCount).map(c => c.marks));
  
//   // Calculate shift statistics
//   const morningMean = mean(morningMarks);
//   const morningStdDev = stdDev(morningMarks, morningMean);
//   const morningMiq = morningMean + morningStdDev;
//   const topMorningCount = Math.max(1, Math.ceil(morningCandidates.length * 0.001));
//   const morningMt = mean(morningCandidates.slice(0, topMorningCount).map(c => c.marks));
  
//   const eveningMean = mean(eveningMarks);
//   const eveningStdDev = stdDev(eveningMarks, eveningMean);
//   const eveningMiq = eveningMean + eveningStdDev;
//   const topEveningCount = Math.max(1, Math.ceil(eveningCandidates.length * 0.001));
//   const eveningMt = mean(eveningCandidates.slice(0, topEveningCount).map(c => c.marks));
  
//   // Determine maximum mean shift
//   const Mqgm = morningMean > eveningMean ? morningMean : eveningMean;
  
//   // Apply normalization formula
//   function normalize(mark: number, shift: "Morning" | "Evening"): number {
//     const Mt = shift === "Morning" ? morningMt : eveningMt;
//     const Miq = shift === "Morning" ? morningMiq : eveningMiq;
    
//     const normalizedMark = ((Mtg - Mgq) / (Mt - Miq)) * (mark - Miq) + Mqgm;
//     return Math.round(normalizedMark * 100000) / 100000; // Round to 5 decimal places
//   }
  
//   // Normalize all candidates
//   const normalizedCandidates = allCandidates.map(candidate => ({
//     ...candidate,
//     originalMarks: candidate.marks,
//     normalizedMarks: normalize(candidate.marks, candidate.shift)
//   }));
  
//   // Sort by normalized marks
//   normalizedCandidates.sort((a, b) => b.normalizedMarks - a.normalizedMarks);
  
//   // Assign ranks
//   const rankedCandidates = normalizedCandidates.map((candidate, index) => ({
//     ...candidate,
//     rank: index + 1
//   }));
  
//   // Print statistics
//   console.log("== STATISTICS ==");
//   console.log(`Global Mean: ${globalMean.toFixed(5)}, StdDev: ${globalStdDev.toFixed(5)}`);
//   console.log(`Morning Mean: ${morningMean.toFixed(5)}, StdDev: ${morningStdDev.toFixed(5)}`);
//   console.log(`Evening Mean: ${eveningMean.toFixed(5)}, StdDev: ${eveningStdDev.toFixed(5)}`);
//   console.log(`Mgq: ${Mgq.toFixed(5)}`);
//   console.log(`Mtg: ${Mtg.toFixed(5)}`);
//   console.log(`Morning Mt: ${morningMt.toFixed(5)}, Miq: ${morningMiq.toFixed(5)}`);
//   console.log(`Evening Mt: ${eveningMt.toFixed(5)}, Miq: ${eveningMiq.toFixed(5)}`);
//   console.log(`Mqgm: ${Mqgm.toFixed(5)}`);
  
//   // Show sample of rankings
//   console.log("\n== BEFORE & AFTER NORMALIZATION (SAMPLE) ==");
//   console.log("ID | Shift | Original Marks | Normalized Marks | Rank");
//   console.log("--------------------------------------------------");
  
//   // Print top 5
//   rankedCandidates.slice(0, 5).forEach(c => {
//     console.log(`${c.id} | ${c.shift} | ${c.originalMarks.toFixed(2)} | ${c.normalizedMarks.toFixed(5)} | ${c.rank}`);
//   });
  
//   // Print some middle ranks
//   console.log("...");
//   rankedCandidates.slice(45, 55).forEach(c => {
//     console.log(`${c.id} | ${c.shift} | ${c.originalMarks.toFixed(2)} | ${c.normalizedMarks.toFixed(5)} | ${c.rank}`);
//   });
  
//   // Print bottom 5
//   console.log("...");
//   rankedCandidates.slice(-5).forEach(c => {
//     console.log(`${c.id} | ${c.shift} | ${c.originalMarks.toFixed(2)} | ${c.normalizedMarks.toFixed(5)} | ${c.rank}`);
//   });
  
//   // Calculate and show shift-wise advantages
//   const morningAdvantage = rankedCandidates
//     .filter(c => c.shift === "Morning")
//     .map(c => c.rank - allCandidates.findIndex(ac => ac.id === c.id) - 1);
  
//   const eveningAdvantage = rankedCandidates
//     .filter(c => c.shift === "Evening")
//     .map(c => c.rank - allCandidates.findIndex(ac => ac.id === c.id) - 1);
  
//   const avgMorningAdvantage = morningAdvantage.reduce((sum, adv) => sum + adv, 0) / morningAdvantage.length;
//   const avgEveningAdvantage = eveningAdvantage.reduce((sum, adv) => sum + adv, 0) / eveningAdvantage.length;
  
//   console.log("\n== NORMALIZATION EFFECT ==");
//   console.log(`Average rank change for Morning shift: ${avgMorningAdvantage.toFixed(2)}`);
//   console.log(`Average rank change for Evening shift: ${avgEveningAdvantage.toFixed(2)}`);