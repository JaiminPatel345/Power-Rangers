import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChoiceSchema, insertAdminSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/colleges", async (_req, res) => {
    try {
      const colleges = await storage.getColleges();
      res.json(colleges || []);
    } catch (error) {
      console.error("Error fetching colleges:", error);
      res.status(500).json({ error: "Failed to fetch colleges", details: error.message });
    }
  });

  app.get("/api/branches", async (_req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: "Failed to fetch branches", details: error.message });
    }
  });

  app.get("/api/historical-cutoffs/:collegeId/:branchId", async (req, res) => {
    const collegeId = parseInt(req.params.collegeId);
    const branchId = parseInt(req.params.branchId);

    if (isNaN(collegeId) || isNaN(branchId)) {
      res.status(400).json({ error: "Invalid college or branch ID" });
      return;
    }

    try {
      const cutoffs = await storage.getHistoricalCutoffsForCollegeAndBranch(collegeId, branchId);
      res.json(cutoffs || []);
    } catch (error) {
      console.error("Error fetching cutoffs:", error);
      res.status(500).json({ error: "Failed to fetch cutoffs", details: error.message });
    }
  });

  app.get("/api/choices", async (_req, res) => {
    try {
      const choices = await storage.getChoices();
      res.json(choices || []);
    } catch (error) {
      console.error("Error fetching choices:", error);
      res.status(500).json({ error: "Failed to fetch choices", details: error.message });
    }
  });

  app.post("/api/choices", async (req, res) => {
    const result = insertChoiceSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const choice = await storage.addChoice(result.data);
    res.json(choice);
  });

  app.delete("/api/choices/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await storage.removeChoice(id);
    res.status(204).send();
  });

  app.patch("/api/choices/:id/priority", async (req, res) => {
    const id = parseInt(req.params.id);
    const priority = parseInt(req.body.priority);
    if (isNaN(id) || isNaN(priority)) {
      res.status(400).json({ error: "Invalid ID or priority" });
      return;
    }
    const choice = await storage.updateChoicePriority(id, priority);
    res.json(choice);
  });


  app.get("/api/historical-cutoffs", async (req, res) => {
    const { collegeId, branchId, year, round, category } = req.query;
    
    // Build filter conditions based on provided query parameters
    let conditions: Record<string, any> = {};
    
    if (collegeId) conditions.collegeId = parseInt(collegeId as string);
    if (branchId) conditions.branchId = parseInt(branchId as string);
    if (year) conditions.year = parseInt(year as string);
    if (round) conditions.round = round;
    if (category) conditions.category = category;
    
    try {
      const cutoffs = await storage.getHistoricalCutoffs(conditions);
      res.json(cutoffs || []);
    } catch (error) {
      console.error("Error fetching historical cutoffs:", error);
      res.status(500).json({ error: "Failed to fetch historical cutoffs", details: error.message });
    }
  });

  // Admin routes
  app.post("/api/admin/register", async (req, res) => {
    const result = insertAdminSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const existingAdmin = await storage.getAdminByInstituteCode(result.data.instituteCode);
    if (existingAdmin) {
      res.status(400).json({ error: "Institute code already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 10);
    const admin = await storage.createAdmin({
      ...result.data,
      password: hashedPassword,
    });

    res.status(201).json({
      id: admin.id,
      instituteCode: admin.instituteCode,
      collegeId: admin.collegeId
    });
  });

  app.post("/api/admin/login", async (req, res) => {
    const { instituteCode, password } = req.body;
    const admin = await storage.getAdminByInstituteCode(instituteCode);

    if (!admin) {
      res.status(401).json({ error: "Invalid institute code or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid institute code or password" });
      return;
    }

    res.json({
      id: admin.id,
      instituteCode: admin.instituteCode,
      collegeId: admin.collegeId
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}