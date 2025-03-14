import { z } from "zod";
import { type College, type Branch } from "@shared/schema";
import { COURSES, CATEGORIES, COLLEGE_TYPES, ROUNDS, BRANCHES } from "./constants";

export const filterSchema = z.object({
  acpcRank: z.number().optional(),
  course: z.enum(COURSES),
  selectedBranches: z.array(z.enum(BRANCHES)),
  round: z.enum(ROUNDS),
  category: z.enum(CATEGORIES),
  selectedCollegeTypes: z.array(z.enum(COLLEGE_TYPES)),
  maxFee: z.number().min(0),
  selectedInstituteBranches: z.array(z.string()), // Store college-branch combinations as "collegeId-branchId"
  selectedInstitutes: z.array(z.string()), // Store collegeIds
});

export type FilterValues = z.infer<typeof filterSchema>;

export type AdmissionChance = "High" | "Medium" | "Low";

// Re-export types from schema
export type { College, Branch };