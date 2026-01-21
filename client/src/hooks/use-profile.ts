import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UserProfile } from "@shared/routes";
import { z } from "zod";

export function useUserProfile() {
  return useQuery({
    queryKey: [api.userProfile.get.path],
    queryFn: async () => {
      const res = await fetch(api.userProfile.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.userProfile.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const validated = api.userProfile.update.input.parse(data);
      const res = await fetch(api.userProfile.update.path, {
        method: api.userProfile.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return api.userProfile.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.userProfile.get.path] }),
  });
}
