import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Government, Grant-in-aid, Private
  city: text("city").notNull(),
  placementRate: real("placement_rate"),
  averagePackage: real("average_package"),
  annualFee: integer("annual_fee").notNull(),
  instituteCode: text("institute_code").notNull().unique(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").notNull(),
  name: text("name").notNull(),
  course: text("course").notNull(), // BE/BTech, Diploma, Pharmacy
  seats: integer("seats").notNull(),
  cutoffRank: integer("cutoff_rank"), // Previous year cutoff
});

export const historicalCutoffs = pgTable("historical_cutoffs", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").notNull(),
  branchId: integer("branch_id").notNull(),
  year: integer("year").notNull(),
  round: text("round").notNull(), // Mock, 1, 2, 3
  category: text("category").notNull(), // General, SC, ST, etc.
  closingRank: integer("closing_rank").notNull(),
  openingRank: integer("opening_rank").notNull(),
});

export const choiceList = pgTable("choice_list", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").notNull(),
  branchId: integer("branch_id").notNull(),
  priority: integer("priority").notNull(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  collegeId: integer("college_id").notNull(),
  instituteCode: text("institute_code").notNull().unique(),
  password: text("password").notNull(),
});

export const insertCollegeSchema = createInsertSchema(colleges).omit({ id: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export const insertHistoricalCutoffSchema = createInsertSchema(historicalCutoffs).omit({ id: true });
export const insertChoiceSchema = createInsertSchema(choiceList).omit({ id: true });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });

export type College = typeof colleges.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type HistoricalCutoff = typeof historicalCutoffs.$inferSelect;
export type Choice = typeof choiceList.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InsertHistoricalCutoff = z.infer<typeof insertHistoricalCutoffSchema>;
export type InsertChoice = z.infer<typeof insertChoiceSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;