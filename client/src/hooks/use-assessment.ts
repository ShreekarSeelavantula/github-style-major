import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useGenerateAssessment() {
  return useMutation({
    mutationFn: async (syllabusId: number) => {
      const res = await fetch(api.assessment.generate.path, {
        method: api.assessment.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate assessment");
      return api.assessment.generate.responses[201].parse(await res.json());
    },
  });
}

export function useSubmitAssessment() {
  return useMutation({
    mutationFn: async ({ id, answers, timeTakenSeconds }: { id: number; answers: number[]; timeTakenSeconds: number }) => {
      const url = buildUrl(api.assessment.submit.path, { id });
      const payload = { answers, timeTakenSeconds };
      
      const res = await fetch(url, {
        method: api.assessment.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit assessment");
      return api.assessment.submit.responses[200].parse(await res.json());
    },
  });
}
