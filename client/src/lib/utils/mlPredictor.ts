
import type { College, Branch } from "@shared/schema";
import type { FilterValues } from "@/lib/types";

interface CutoffData {
  collegeId: number;
  branchId: number;
  year: number;
  round: string;
  category: string;
  closingRank: number;
  openingRank: number;
}

// This would ideally be loaded from the API based on the PDF/CSV data
const historicalCutoffs: CutoffData[] = [
  // DAIICT - ICT
  { collegeId: 1, branchId: 1, year: 2023, round: "Mock", category: "General", openingRank: 1, closingRank: 500 },
  { collegeId: 1, branchId: 1, year: 2022, round: "Mock", category: "General", openingRank: 1, closingRank: 520 },
  { collegeId: 1, branchId: 1, year: 2021, round: "Mock", category: "General", openingRank: 1, closingRank: 480 },
  
  // LDCE - Computer Engineering
  { collegeId: 2, branchId: 2, year: 2023, round: "Mock", category: "General", openingRank: 501, closingRank: 1000 },
  { collegeId: 2, branchId: 2, year: 2022, round: "Mock", category: "General", openingRank: 521, closingRank: 1050 },
  { collegeId: 2, branchId: 2, year: 2021, round: "Mock", category: "General", openingRank: 481, closingRank: 980 },
  
  // LDCE - IT
  { collegeId: 2, branchId: 3, year: 2023, round: "Mock", category: "General", openingRank: 1001, closingRank: 1200 },
  { collegeId: 2, branchId: 3, year: 2022, round: "Mock", category: "General", openingRank: 1051, closingRank: 1250 },
  { collegeId: 2, branchId: 3, year: 2021, round: "Mock", category: "General", openingRank: 981, closingRank: 1180 },
  
  // More data for other colleges and branches...
  // NU - Computer Engineering
  { collegeId: 3, branchId: 8, year: 2023, round: "Mock", category: "General", openingRank: 600, closingRank: 800 },
  { collegeId: 3, branchId: 8, year: 2022, round: "Mock", category: "General", openingRank: 580, closingRank: 820 },
  { collegeId: 3, branchId: 8, year: 2021, round: "Mock", category: "General", openingRank: 590, closingRank: 810 },
];

/**
 * Predicts admission chance based on historical cutoffs and current rank
 */
export function predictAdmissionChance(
  college: College,
  branch: Branch,
  filters: FilterValues
): { chance: "High" | "Medium" | "Low"; percentage: number } {
  const rank = filters.acpcRank || 0;
  if (!rank) return { chance: "Medium", percentage: 50 };

  // Get relevant historical data for this college-branch combination
  const relevantData = historicalCutoffs.filter(
    data => 
      data.collegeId === college.id && 
      data.branchId === branch.id &&
      data.round === filters.round &&
      data.category === filters.category
  );

  if (relevantData.length === 0) {
    // Fallback to simple heuristic if no historical data
    return fallbackCalculation(college, branch, rank);
  }

  // Calculate trend over years (linear regression would be ideal here)
  // For simplicity, we'll use the average closing rank
  const avgClosingRank = relevantData.reduce((sum, data) => sum + data.closingRank, 0) / relevantData.length;
  const avgOpeningRank = relevantData.reduce((sum, data) => sum + data.openingRank, 0) / relevantData.length;
  
  // Calculate percentage chance based on where student ranks in historical range
  if (rank <= avgOpeningRank) {
    return { chance: "High", percentage: 95 };
  } else if (rank > avgClosingRank) {
    return { chance: "Low", percentage: 15 };
  } else {
    // Linear scale from high to low as rank moves from opening to closing
    const range = avgClosingRank - avgOpeningRank;
    const position = rank - avgOpeningRank;
    const percentage = 95 - (position / range) * 60; // Scale from 95% to 35%
    
    let chance: "High" | "Medium" | "Low";
    if (percentage >= 70) chance = "High";
    else if (percentage >= 40) chance = "Medium";
    else chance = "Low";
    
    return { chance, percentage: Math.round(percentage) };
  }
}

/**
 * Fallback calculation when historical data isn't available
 */
function fallbackCalculation(
  college: College,
  branch: Branch,
  rank: number
): { chance: "High" | "Medium" | "Low"; percentage: number } {
  const cutoffRank = branch.cutoffRank || 1500; // Default if not specified
  
  // Use placement rate and college type as weighting factors
  const placementWeight = (college.placementRate || 75) / 100;
  const typeWeight = college.type === "Government" ? 1.1 : 
                    college.type === "Grant-in-aid" ? 1.0 : 0.9;
  
  // Adjust cutoff based on weights
  const adjustedCutoff = cutoffRank * placementWeight * typeWeight;
  
  // Calculate percentage
  if (rank <= adjustedCutoff * 0.6) {
    return { chance: "High", percentage: 90 };
  } else if (rank > adjustedCutoff * 1.1) {
    return { chance: "Low", percentage: 20 };
  } else {
    // Linear scale
    const percentage = 90 - ((rank - adjustedCutoff * 0.6) / (adjustedCutoff * 0.5)) * 50;
    
    let chance: "High" | "Medium" | "Low";
    if (percentage >= 70) chance = "High";
    else if (percentage >= 40) chance = "Medium";
    else chance = "Low";
    
    return { chance, percentage: Math.round(percentage) };
  }
}

/**
 * Get ranked recommendations based on student rank and preferences
 */
export function getRankedRecommendations(
  colleges: College[],
  branches: Branch[],
  filters: FilterValues
): { college: College; branch: Branch; chance: { chance: string; percentage: number } }[] {
  if (!filters.acpcRank) return [];
  
  const results: { 
    college: College; 
    branch: Branch; 
    chance: { chance: string; percentage: number };
    score: number; 
  }[] = [];

  colleges.forEach(college => {
    // Skip if college doesn't match filters
    if (filters.selectedCollegeTypes.length && !filters.selectedCollegeTypes.includes(college.type as any)) {
      return;
    }
    
    if (filters.maxFee && college.annualFee > filters.maxFee) {
      return;
    }

    const collegeBranches = branches.filter(b => 
      b.collegeId === college.id && 
      (filters.selectedBranches.length === 0 || filters.selectedBranches.includes(b.name as any)) &&
      b.course === filters.course
    );

    collegeBranches.forEach(branch => {
      const chance = predictAdmissionChance(college, branch, filters);
      
      // Calculate a score based on admission chance and other factors
      // This enables ranking the recommendations
      let score = chance.percentage;
      
      // Boost score based on placement rate
      if (college.placementRate) {
        score += (college.placementRate / 2);
      }
      
      // Boost score based on average package
      if (college.averagePackage) {
        const packageBoost = college.averagePackage / 200000; // Adjust based on LPA
        score += packageBoost;
      }
      
      // Apply penalties for high fees
      const feePenalty = college.annualFee / 50000; // Adjust based on fee range
      score -= feePenalty;
      
      results.push({
        college,
        branch,
        chance,
        score
      });
    });
  });

  // Sort by score in descending order
  return results
    .sort((a, b) => b.score - a.score)
    .map(({college, branch, chance}) => ({college, branch, chance}));
}
