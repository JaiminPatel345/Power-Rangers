
import { create } from 'zustand';
import type { College, Branch } from "@shared/schema";

interface CompareStore {
  colleges: Array<{college: College; branch: Branch}>;
  addCollege: (college: College, branch: Branch) => void;
  removeCollege: (collegeId: number, branchId: number) => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
  colleges: [],
  addCollege: (college, branch) => set((state) => ({
    colleges: [...state.colleges, { college, branch }]
  })),
  removeCollege: (collegeId, branchId) => set((state) => ({
    colleges: state.colleges.filter(item => 
      !(item.college.id === collegeId && item.branch.id === branchId)
    )
  }))
}));
