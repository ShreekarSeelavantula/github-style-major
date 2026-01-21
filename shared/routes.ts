import { z } from 'zod';
import { insertUserProfileSchema, insertSyllabusSchema, insertStudyPlanSchema, syllabi, topics, familiarityTests, studyPlans, dailyTasks, userProfiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// MCQ Question Schema
export const mcqQuestionSchema = z.object({
  id: z.number().optional(),
  topic: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(), // Index 0-3
});

export const api = {
  userProfile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile',
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profile',
      input: insertUserProfileSchema.partial(),
      responses: {
        200: z.custom<typeof userProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  syllabus: {
    list: {
      method: 'GET' as const,
      path: '/api/syllabi',
      responses: {
        200: z.array(z.custom<typeof syllabi.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/syllabi/:id',
      responses: {
        200: z.custom<typeof syllabi.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Note: Upload usually handled via multipart/form-data, input validation specific to route
    upload: {
        method: 'POST' as const,
        path: '/api/syllabi/upload',
        // Input is FormData (file)
        responses: {
            201: z.custom<typeof syllabi.$inferSelect>(),
            400: errorSchemas.validation,
        }
    },
    parse: {
        method: 'POST' as const,
        path: '/api/syllabi/:id/parse',
        responses: {
            200: z.array(z.custom<typeof topics.$inferSelect>()),
            404: errorSchemas.notFound,
        }
    }
  },
  assessment: {
    generate: {
      method: 'POST' as const,
      path: '/api/assessment/generate',
      input: z.object({ syllabusId: z.number() }),
      responses: {
        201: z.custom<typeof familiarityTests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/assessment/:id/submit',
      input: z.object({
        answers: z.array(z.number()), // Array of selected option indices
        timeTakenSeconds: z.number(),
      }),
      responses: {
        200: z.object({
            score: z.number(),
            determinedPace: z.enum(["Slow", "Medium", "Fast"]),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  plans: {
    create: {
      method: 'POST' as const,
      path: '/api/plans',
      input: insertStudyPlanSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof studyPlans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/plans',
      responses: {
        200: z.array(z.custom<typeof studyPlans.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/plans/:id',
      responses: {
        200: z.object({
            plan: z.custom<typeof studyPlans.$inferSelect>(),
            tasks: z.array(z.custom<typeof dailyTasks.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: z.object({ status: z.enum(["pending", "completed", "missed"]) }),
      responses: {
        200: z.custom<typeof dailyTasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
