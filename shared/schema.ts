import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

// User Profiles - stores academic info and learning pace
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull().unique(), // Link to Auth user
  academicLevel: text("academic_level"), // e.g. "High School", "B.Tech"
  learningPace: text("learning_pace").default("Medium"), // "Slow", "Medium", "Fast"
  createdAt: timestamp("created_at").defaultNow(),
});

// Syllabi - stores uploaded syllabus metadata and processed content
export const syllabi = pgTable("syllabi", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Path or URL to stored file
  rawText: text("raw_text"), // OCR extracted text
  processedData: jsonb("processed_data"), // Extracted structured data (subjects, topics)
  createdAt: timestamp("created_at").defaultNow(),
});

// Topics - extracted from syllabus
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  syllabusId: integer("syllabus_id").references(() => syllabi.id).notNull(),
  subject: text("subject").notNull(),
  name: text("name").notNull(),
  subtopics: jsonb("subtopics").$type<string[]>(), // Array of subtopic strings
  difficulty: text("difficulty").default("Medium"), // "Easy", "Medium", "Hard"
  order: integer("order").notNull(), // Order in the syllabus
});

// Familiarity Tests - quiz sessions
export const familiarityTests = pgTable("familiarity_tests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  syllabusId: integer("syllabus_id").references(() => syllabi.id).notNull(),
  questions: jsonb("questions").notNull(), // Array of generated MCQs
  score: integer("score"), // 0-100
  determinedPace: text("determined_pace"), // "Slow", "Medium", "Fast"
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study Plans - generated schedule
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  syllabusId: integer("syllabus_id").references(() => syllabi.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  examDate: timestamp("exam_date").notNull(),
  dailyHours: integer("daily_hours").notNull().default(2),
  status: text("status").default("active"), // "active", "completed", "archived"
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Tasks - items in the study plan
export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => studyPlans.id).notNull(),
  topicId: integer("topic_id").references(() => topics.id), // Nullable for "Revision" or generic tasks
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: text("status").default("pending"), // "pending", "completed", "missed"
  isRevision: boolean("is_revision").default(false),
});

// === RELATIONS ===

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const syllabiRelations = relations(syllabi, ({ one, many }) => ({
  user: one(users, {
    fields: [syllabi.userId],
    references: [users.id],
  }),
  topics: many(topics),
  plans: many(studyPlans),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  syllabus: one(syllabi, {
    fields: [topics.syllabusId],
    references: [syllabi.id],
  }),
  tasks: many(dailyTasks),
}));

export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  syllabus: one(syllabi, {
    fields: [studyPlans.syllabusId],
    references: [syllabi.id],
  }),
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id],
  }),
  tasks: many(dailyTasks),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  plan: one(studyPlans, {
    fields: [dailyTasks.planId],
    references: [studyPlans.id],
  }),
  topic: one(topics, {
    fields: [dailyTasks.topicId],
    references: [topics.id],
  }),
}));


// === ZOD SCHEMAS ===
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true });
export const insertSyllabusSchema = createInsertSchema(syllabi).omit({ id: true, createdAt: true, rawText: true, processedData: true });
export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true, status: true });

// Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type Syllabus = typeof syllabi.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type FamiliarityTest = typeof familiarityTests.$inferSelect;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type DailyTask = typeof dailyTasks.$inferSelect;
