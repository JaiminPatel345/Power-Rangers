import { colleges, branches, choiceList, admins, historicalCutoffs } from "@shared/schema";
import type { College, Branch, Choice, Admin, HistoricalCutoff, InsertCollege, InsertBranch, InsertChoice, InsertAdmin, InsertHistoricalCutoff } from "@shared/schema";

export interface IStorage {
  getColleges(): Promise<College[]>;
  getBranches(): Promise<Branch[]>;
  getChoices(): Promise<Choice[]>;
  addChoice(choice: InsertChoice): Promise<Choice>;
  removeChoice(id: number): Promise<void>;
  updateChoicePriority(id: number, priority: number): Promise<Choice>;

  // Historical cutoff methods
  getHistoricalCutoffs(conditions?: Record<string, any>): Promise<HistoricalCutoff[]>;
  getHistoricalCutoffsForCollegeAndBranch(collegeId: number, branchId: number): Promise<HistoricalCutoff[]>;
  addHistoricalCutoff(cutoff: InsertHistoricalCutoff): Promise<HistoricalCutoff>;

  // Admin methods
  getAdminByInstituteCode(instituteCode: string): Promise<Admin | null>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
}

export class MemStorage implements IStorage {
  private colleges: Map<number, College>;
  private branches: Map<number, Branch>;
  private choices: Map<number, Choice>;
  private admins: Map<number, Admin>;
  private historicalCutoffs: Map<number, HistoricalCutoff>;
  private currentCollegeId: number = 1;
  private currentBranchId: number = 1;
  private currentChoiceId: number = 1;
  private currentAdminId: number = 1;
  private currentHistoricalCutoffId: number = 1;

  constructor() {
    this.colleges = new Map();
    this.branches = new Map();
    this.choices = new Map();
    this.admins = new Map();
    this.historicalCutoffs = new Map();
    this.initializeMockData();
  }

  async getHistoricalCutoffs(conditions?: Record<string, any>): Promise<HistoricalCutoff[]> {
    let filteredCutoffs = Array.from(this.historicalCutoffs.values());

    if (conditions) {
      if (conditions.collegeId) {
        filteredCutoffs = filteredCutoffs.filter(cutoff => cutoff.collegeId === conditions.collegeId);
      }
      if (conditions.branchId) {
        filteredCutoffs = filteredCutoffs.filter(cutoff => cutoff.branchId === conditions.branchId);
      }
      if (conditions.year) {
        filteredCutoffs = filteredCutoffs.filter(cutoff => cutoff.year === conditions.year);
      }
      if (conditions.round) {
        filteredCutoffs = filteredCutoffs.filter(cutoff => cutoff.round === conditions.round);
      }
      if (conditions.category) {
        filteredCutoffs = filteredCutoffs.filter(cutoff => cutoff.category === conditions.category);
      }
    }

    return filteredCutoffs.sort((a, b) => b.year - a.year || a.round.localeCompare(b.round));
  }

  async getHistoricalCutoffsForCollegeAndBranch(collegeId: number, branchId: number): Promise<HistoricalCutoff[]> {
    return this.getHistoricalCutoffs({
      collegeId,
      branchId
    });
  }


  async addHistoricalCutoff(cutoff: InsertHistoricalCutoff): Promise<HistoricalCutoff> {
    const id = this.currentHistoricalCutoffId++;
    const newCutoff: HistoricalCutoff = { ...cutoff, id };
    this.historicalCutoffs.set(id, newCutoff);
    return newCutoff;
  }

  private initializeMockData() {
    // Sample data from ACPC institutions
    const collegeData: InsertCollege[] = [
      {
        name: "Dhirubhai Ambani Institute of Information and Communication Technology",
        type: "Private",
        city: "Gandhinagar",
        placementRate: 95,
        averagePackage: 1200000,
        annualFee: 200000,
        instituteCode: "DAIICT"
      },
      {
        name: "L.D. College of Engineering",
        type: "Government",
        city: "Ahmedabad",
        placementRate: 85,
        averagePackage: 800000,
        annualFee: 120000,
        instituteCode: "LDCE"
      },
      {
        name: "Birla Vishvakarma Mahavidyalaya",
        type: "Grant-in-aid",
        city: "Anand",
        placementRate: 80,
        averagePackage: 700000,
        annualFee: 150000,
        instituteCode: "BVM"
      },
      {
        name: "Maharaja Sayajirao University",
        type: "Government",
        city: "Vadodara",
        placementRate: 82,
        averagePackage: 750000,
        annualFee: 130000,
        instituteCode: "MSU"
      },
      {
        name: "Nirma University",
        type: "Private",
        city: "Ahmedabad",
        placementRate: 90,
        averagePackage: 900000,
        annualFee: 180000,
        instituteCode: "NU"
      }
    ];

    collegeData.forEach(college => {
      const id = this.currentCollegeId++;
      this.colleges.set(id, { ...college, id });
    });

    // Add branches for each college with cutoff ranks
    const branchData = new Map([
      ["DAIICT", ["ICT"]],
      ["LDCE", ["Computer Engineering", "IT", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering"]],
      ["NU", ["Computer Engineering", "IT", "Mechanical Engineering", "Chemical Engineering"]],
      ["BVM", ["Computer Engineering", "IT", "Civil Engineering", "Mechanical Engineering"]],
      ["MSU", ["Computer Engineering", "IT", "Civil Engineering", "Chemical Engineering"]]
    ]);

    // Cutoff ranks based on merit (lower is better)
    const cutoffRanks = {
      "DAIICT": { "ICT": 500 },
      "LDCE": {
        "Computer Engineering": 1000,
        "IT": 1200,
        "Civil Engineering": 2000,
        "Mechanical Engineering": 1800,
        "Electrical Engineering": 1500
      },
      "NU": {
        "Computer Engineering": 800,
        "IT": 1000,
        "Mechanical Engineering": 1600,
        "Chemical Engineering": 1800
      },
      "BVM": {
        "Computer Engineering": 1300,
        "IT": 1500,
        "Civil Engineering": 2200,
        "Mechanical Engineering": 2000
      },
      "MSU": {
        "Computer Engineering": 1400,
        "IT": 1600,
        "Civil Engineering": 2300,
        "Chemical Engineering": 2100
      }
    };

    this.colleges.forEach(college => {
      const collegeBranches = branchData.get(college.instituteCode) || [];

      collegeBranches.forEach(branchName => {
        const cutoffRank = cutoffRanks[college.instituteCode]?.[branchName] ||
          Math.floor(Math.random() * 5000) + 1000; // Random cutoff for colleges without data

        const branch: InsertBranch = {
          collegeId: college.id,
          name: branchName,
          course: "BE/BTech",
          seats: 120,
          cutoffRank
        };
        const id = this.currentBranchId++;
        this.branches.set(id, { ...branch, id });
      });
    });
    // After initializing colleges and branches, add historical cutoff data
    const years = [2022, 2023, 2024];
    const rounds = ["Mock", "1", "2", "3"];
    const categories = ["General", "EWS", "OBC", "SC", "ST"];

    this.colleges.forEach(college => {
      const branches = Array.from(this.branches.values())
        .filter(b => b.collegeId === college.id);

      branches.forEach(branch => {
        years.forEach(year => {
          rounds.forEach(round => {
            categories.forEach(category => {
              // Base cutoff on college prestige and trending improvements
              let baseCutoff = branch.cutoffRank || 5000;
              // Adjust for year (slight improvement each year)
              baseCutoff -= (year - 2022) * 100;
              // Adjust for round (later rounds have higher cutoffs)
              baseCutoff += rounds.indexOf(round) * 200;
              // Adjust for category
              const categoryMultiplier = {
                "General": 1,
                "EWS": 1.2,
                "OBC": 1.3,
                "SC": 1.5,
                "ST": 1.7,
              }[category] || 1;

              const cutoff: InsertHistoricalCutoff = {
                collegeId: college.id,
                branchId: branch.id,
                year,
                round,
                category,
                closingRank: Math.floor(baseCutoff * categoryMultiplier),
                openingRank: Math.floor(baseCutoff * categoryMultiplier * 0.8),
              };

              this.addHistoricalCutoff(cutoff);
            });
          });
        });
      });
    });
  }

  async getColleges(): Promise<College[]> {
    const colleges = Array.from(this.colleges.values());
    const branches = Array.from(this.branches.values());

    // Get minimum cutoff rank for each college
    const collegeMinCutoffs = new Map<number, number>();
    colleges.forEach(college => {
      const collegeBranches = branches.filter(b => b.collegeId === college.id);
      const minCutoff = Math.min(...collegeBranches.map(b => b.cutoffRank || Infinity));
      collegeMinCutoffs.set(college.id, minCutoff);
    });

    // Sort colleges by minimum cutoff rank (lower is better)
    return colleges.sort((a, b) => {
      const aCutoff = collegeMinCutoffs.get(a.id) || Infinity;
      const bCutoff = collegeMinCutoffs.get(b.id) || Infinity;
      return aCutoff - bCutoff;
    });
  }

  async getBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getChoices(): Promise<Choice[]> {
    return Array.from(this.choices.values());
  }

  async addChoice(choice: InsertChoice): Promise<Choice> {
    const id = this.currentChoiceId++;
    const newChoice: Choice = { ...choice, id };
    this.choices.set(id, newChoice);
    return newChoice;
  }

  async removeChoice(id: number): Promise<void> {
    this.choices.delete(id);
  }

  async updateChoicePriority(id: number, priority: number): Promise<Choice> {
    const choice = this.choices.get(id);
    if (!choice) throw new Error("Choice not found");
    const updatedChoice = { ...choice, priority };
    this.choices.set(id, updatedChoice);
    return updatedChoice;
  }

  async getAdminByInstituteCode(instituteCode: string): Promise<Admin | null> {
    return Array.from(this.admins.values()).find(admin => admin.instituteCode === instituteCode) || null;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.currentAdminId++;
    const newAdmin: Admin = { ...admin, id };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }
}

export const storage = new MemStorage();