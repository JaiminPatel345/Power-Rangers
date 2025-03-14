import type { College, Branch } from "@shared/schema";
import type { FilterValues } from "@/lib/types";

interface AdmissionChanceResult {
  chance: "High" | "Medium" | "Low";
  percentage: number;
}

import { predictAdmissionChance } from './mlPredictor';

export function calculateAdmissionChance(
  college: College,
  _branch: string,
  filters: FilterValues
): AdmissionChanceResult {
  // Find the branch object that matches this name
  const branchObj = branches.find(b => b.name === _branch && b.collegeId === college.id);
  
  if (!branchObj) {
    // Fallback to simple calculation if branch not found
    const rank = filters.acpcRank || 0;
    if (!rank) return { chance: "Medium", percentage: 50 };
    
    const placementWeight = (college.placementRate || 75) / 100;
    const threshold = 1000; // Base threshold
    const deviation = 500; // Allowed deviation
    
    let percentage = 100 - (Math.max(0, rank - threshold) / deviation) * 100;
    percentage = Math.min(100, Math.max(0, percentage));
    percentage = percentage * placementWeight;
    
    let chance: "High" | "Medium" | "Low";
    if (percentage >= 70) chance = "High";
    else if (percentage >= 40) chance = "Medium";
    else chance = "Low";
    
    return {
      chance,
      percentage: Math.round(percentage)
    };
  }
  
  // Use the ML-based prediction
  return predictAdmissionChance(college, branchObj, filters);
}

import { getRankedRecommendations } from './mlPredictor';

// This variable needs to be accessible to calculateAdmissionChance
let branches: Branch[] = [];

export function filterColleges(
  colleges: College[], 
  branchesData: Branch[],
  filters: FilterValues
): College[] {
  // Store branches for use in calculateAdmissionChance
  branches = branchesData;
  
  // If we have an ACPC rank, use the ML-based recommendation engine
  if (filters.acpcRank && filters.acpcRank > 0) {
    const recommendations = getRankedRecommendations(colleges, branchesData, filters);
    
    // Return unique colleges from recommendations, maintaining order
    const uniqueCollegeIds = new Set<number>();
    return recommendations
      .filter(item => {
        if (uniqueCollegeIds.has(item.college.id)) {
          return false;
        }
        uniqueCollegeIds.add(item.college.id);
        return true;
      })
      .map(item => item.college);
  }
  
  // Fallback to basic filtering if no rank provided
  return colleges.filter(college => {
    // Basic college filters
    if (filters.maxFee && college.annualFee > filters.maxFee) return false;
    if (filters.selectedCollegeTypes.length && !filters.selectedCollegeTypes.includes(college.type as any)) return false;

    // Check if college has any matching branches
    const collegeBranches = branches.filter(b => b.collegeId === college.id);
    const hasMatchingBranch = collegeBranches.some(branch => 
      filters.selectedBranches.length === 0 || // If no branches selected, show all
      (filters.selectedBranches.includes(branch.name as any) && 
       branch.course === filters.course) // Match both branch name and course
    );

    // Specific institute filters
    if (filters.selectedInstitutes.length && !filters.selectedInstitutes.includes(college.id.toString())) {
      return false;
    }

    // Institute-branch combination filters
    if (filters.selectedInstituteBranches.length) {
      const hasSelectedCombination = filters.selectedInstituteBranches.some(combination => {
        const [collegeId] = combination.split("-");
        return collegeId === college.id.toString();
      });
      if (!hasSelectedCombination) return false;
    }

    return hasMatchingBranch;
  });
}