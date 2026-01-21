import { db } from "./db";
import {
  userProfiles, syllabi, topics, familiarityTests, studyPlans, dailyTasks,
  type UserProfile, type Syllabus, type Topic, type FamiliarityTest, type StudyPlan, type DailyTask,
  type InsertUserProfile, type InsertSyllabus, type InsertStudyPlan
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User Profile
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;

  // Syllabus
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  getSyllabi(userId: string): Promise<Syllabus[]>;
  getSyllabus(id: number): Promise<Syllabus | undefined>;
  
  // Topics
  createTopics(newTopics: Omit<Topic, "id">[]): Promise<Topic[]>;
  getTopics(syllabusId: number): Promise<Topic[]>;

  // Assessment
  createTest(test:  Omit<FamiliarityTest, "id" | "createdAt">): Promise<FamiliarityTest>;
  updateTestScore(id: number, score: number, pace: string): Promise<FamiliarityTest>;
  getTest(id: number): Promise<FamiliarityTest | undefined>;

  // Study Plan
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getStudyPlans(userId: string): Promise<StudyPlan[]>;
  getStudyPlan(id: number): Promise<StudyPlan | undefined>;
  
  // Tasks
  createDailyTasks(tasks: Omit<DailyTask, "id">[]): Promise<DailyTask[]>;
  getPlanTasks(planId: number): Promise<DailyTask[]>;
  updateTaskStatus(id: number, status: string): Promise<DailyTask>;
}

export class DatabaseStorage implements IStorage {
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updated] = await db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus> {
    const [newSyllabus] = await db.insert(syllabi).values(syllabus).returning();
    return newSyllabus;
  }

  async getSyllabi(userId: string): Promise<Syllabus[]> {
    return db.select().from(syllabi).where(eq(syllabi.userId, userId)).orderBy(desc(syllabi.createdAt));
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    const [syllabus] = await db.select().from(syllabi).where(eq(syllabi.id, id));
    return syllabus;
  }

  async createTopics(newTopics: Omit<Topic, "id">[]): Promise<Topic[]> {
    return db.insert(topics).values(newTopics).returning();
  }

  async getTopics(syllabusId: number): Promise<Topic[]> {
    return db.select().from(topics).where(eq(topics.syllabusId, syllabusId)).orderBy(topics.order);
  }

  async createTest(test: Omit<FamiliarityTest, "id" | "createdAt">): Promise<FamiliarityTest> {
    const [newTest] = await db.insert(familiarityTests).values(test).returning();
    return newTest;
  }

  async updateTestScore(id: number, score: number, pace: string): Promise<FamiliarityTest> {
    const [updated] = await db.update(familiarityTests)
      .set({ score, determinedPace: pace, completedAt: new Date() })
      .where(eq(familiarityTests.id, id))
      .returning();
    return updated;
  }
  
  async getTest(id: number): Promise<FamiliarityTest | undefined> {
      const [test] = await db.select().from(familiarityTests).where(eq(familiarityTests.id, id));
      return test;
  }

  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const [newPlan] = await db.insert(studyPlans).values(plan).returning();
    return newPlan;
  }

  async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    return db.select().from(studyPlans).where(eq(studyPlans.userId, userId)).orderBy(desc(studyPlans.createdAt));
  }

  async getStudyPlan(id: number): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.id, id));
    return plan;
  }

  async createDailyTasks(tasks: Omit<DailyTask, "id">[]): Promise<DailyTask[]> {
    return db.insert(dailyTasks).values(tasks).returning();
  }

  async getPlanTasks(planId: number): Promise<DailyTask[]> {
    return db.select().from(dailyTasks).where(eq(dailyTasks.planId, planId)).orderBy(dailyTasks.date);
  }

  async updateTaskStatus(id: number, status: string): Promise<DailyTask> {
    const [updated] = await db.update(dailyTasks)
      .set({ status })
      .where(eq(dailyTasks.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
