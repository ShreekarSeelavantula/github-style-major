import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertStudyPlan } from "@shared/routes";
import { z } from "zod";

// Create Plan Types
type CreatePlanInput = Omit<z.infer<typeof api.plans.create.input>, "userId">;

export function usePlans() {
  return useQuery({
    queryKey: [api.plans.list.path],
    queryFn: async () => {
      const res = await fetch(api.plans.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch plans");
      return api.plans.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: [api.plans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.plans.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch plan");
      return api.plans.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePlanInput) => {
      // Ensure dates are properly serialized (API expects ISO strings, Zod handles coercion but let's be safe)
      const res = await fetch(api.plans.create.path, {
        method: api.plans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create plan");
      return api.plans.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.plans.list.path] }),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "completed" | "missed" }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate all plan details since we don't know which plan this task belongs to easily
      // A more optimized approach would be to return planId from the task update
      queryClient.invalidateQueries({ queryKey: [api.plans.get.path] });
    },
  });
}
