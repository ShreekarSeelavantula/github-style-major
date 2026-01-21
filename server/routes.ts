import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { api, mcqQuestionSchema } from "@shared/routes";
import { extractTextFromFile } from "./lib/ocr";
import { parseSyllabusText } from "./lib/nlp";
import { generateSchedule } from "./lib/scheduler";
import { openai } from "./replit_integrations/image/client"; // reusing client with OPENAI keys
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === USER PROFILE ===
  app.get(api.userProfile.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getUserProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.put(api.userProfile.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
        const existing = await storage.getUserProfile(userId);
        if (existing) {
             const updated = await storage.updateUserProfile(userId, req.body);
             res.json(updated);
        } else {
             const created = await storage.createUserProfile({ ...req.body, userId });
             res.json(created);
        }
    } catch (e) {
        res.status(400).json({ message: "Update failed" });
    }
  });

  // === SYLLABUS ===
  app.post(api.syllabus.upload.path, isAuthenticated, upload.single("file"), async (req: any, res) => {
    const userId = req.user.claims.sub;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    try {
        const text = await extractTextFromFile(req.file.path, req.file.mimetype);
        
        // Save syllabus
        const syllabus = await storage.createSyllabus({
            userId,
            fileName: req.file.originalname,
            fileUrl: req.file.path, // In a real app, upload to Object Storage
            rawText: text,
            processedData: {}
        });
        
        // Clean up temp file
        // await fs.unlink(req.file.path); // Keep for now or move to perm storage
        
        res.status(201).json(syllabus);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to process file" });
    }
  });

  app.post(api.syllabus.parse.path, isAuthenticated, async (req: any, res) => {
    const syllabusId = parseInt(req.params.id);
    const syllabus = await storage.getSyllabus(syllabusId);
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });
    
    if (!syllabus.rawText) return res.status(400).json({ message: "No text content" });

    const extractedTopics = parseSyllabusText(syllabus.rawText);
    
    // Save topics
    const topics = await storage.createTopics(extractedTopics.map(t => ({
        syllabusId,
        subject: t.subject,
        name: t.name,
        subtopics: t.subtopics,
        difficulty: t.difficulty,
        order: t.order
    })));
    
    res.json(topics);
  });
  
  app.get(api.syllabus.list.path, isAuthenticated, async (req: any, res) => {
      const userId = req.user.claims.sub;
      const syllabi = await storage.getSyllabi(userId);
      res.json(syllabi);
  });

  // === ASSESSMENT ===
  app.post(api.assessment.generate.path, isAuthenticated, async (req: any, res) => {
      const { syllabusId } = req.body;
      const topics = await storage.getTopics(syllabusId);
      
      if (topics.length === 0) return res.status(400).json({ message: "Parse syllabus first" });
      
      // Select random topics for quiz
      const selectedTopics = topics.slice(0, 5); // Take first 5 for MVP simplicity
      
      // Generate MCQs using OpenAI
      // Prompt construction
      const prompt = `Generate 5 multiple-choice questions (MCQs) for a beginner level student based on these topics: ${selectedTopics.map(t => t.name).join(", ")}. 
      Return strictly a JSON array of objects with keys: topic, question, options (array of 4 strings), correctAnswer (index 0-3).`;
      
      try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        
        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || "{}");
        const questions = result.questions || []; // Assuming AI returns { questions: [...] }
        
        const test = await storage.createTest({
            userId: req.user.claims.sub,
            syllabusId,
            questions: questions,
            score: null,
            determinedPace: null,
            completedAt: null
        });
        
        res.status(201).json(test);
      } catch (e) {
          console.error("AI Error:", e);
          res.status(500).json({ message: "Failed to generate assessment" });
      }
  });
  
  app.post(api.assessment.submit.path, isAuthenticated, async (req, res) => {
     const testId = parseInt(req.params.id);
     const { answers } = req.body; // array of indices
     
     const test = await storage.getTest(testId);
     if (!test) return res.status(404).json({ message: "Test not found" });
     
     const questions = test.questions as any[];
     let correctCount = 0;
     
     questions.forEach((q, idx) => {
         if (answers[idx] === q.correctAnswer) correctCount++;
     });
     
     const score = (correctCount / questions.length) * 100;
     
     // Pace Classification Rules
     // < 40% -> Slow, 40-70% -> Medium, > 70% -> Fast
     let pace = "Medium";
     if (score < 40) pace = "Slow";
     else if (score > 70) pace = "Fast";
     
     const updated = await storage.updateTestScore(testId, score, pace);
     
     // Also update user profile
     // await storage.updateUserProfile(test.userId, { learningPace: pace });
     
     res.json({ score, determinedPace: pace });
  });

  // === PLANS ===
  app.post(api.plans.create.path, isAuthenticated, async (req: any, res) => {
      const { syllabusId, startDate, examDate, dailyHours } = req.body;
      const userId = req.user.claims.sub;
      
      // Get User Pace (from profile or last test)
      // For MVP, just defaulting to Medium if not found, or could query profile
      const profile = await storage.getUserProfile(userId);
      const pace = (profile?.learningPace as "Slow" | "Medium" | "Fast") || "Medium";
      
      const topics = await storage.getTopics(syllabusId);
      
      const scheduleTasks = generateSchedule(
          topics, 
          new Date(startDate), 
          new Date(examDate), 
          dailyHours, 
          pace
      );
      
      const plan = await storage.createStudyPlan({
          userId,
          syllabusId,
          startDate: new Date(startDate),
          examDate: new Date(examDate),
          dailyHours,
          status: "active"
      });
      
      await storage.createDailyTasks(scheduleTasks.map(t => ({
          planId: plan.id,
          topicId: t.topicId,
          date: t.date,
          description: t.description,
          durationMinutes: t.durationMinutes,
          isRevision: t.isRevision,
          status: "pending"
      })));
      
      res.status(201).json(plan);
  });
  
  app.get(api.plans.get.path, isAuthenticated, async (req: any, res) => {
      const planId = parseInt(req.params.id);
      const plan = await storage.getStudyPlan(planId);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      const tasks = await storage.getPlanTasks(planId);
      res.json({ plan, tasks });
  });
  
  app.get(api.plans.list.path, isAuthenticated, async (req: any, res) => {
      const plans = await storage.getStudyPlans(req.user.claims.sub);
      res.json(plans);
  });

  app.patch(api.tasks.update.path, isAuthenticated, async (req, res) => {
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      const updated = await storage.updateTaskStatus(taskId, status);
      res.json(updated);
  });

  return httpServer;
}
