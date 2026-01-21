import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSyllabi() {
  return useQuery({
    queryKey: [api.syllabus.list.path],
    queryFn: async () => {
      const res = await fetch(api.syllabus.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch syllabi");
      return api.syllabus.list.responses[200].parse(await res.json());
    },
  });
}

export function useSyllabus(id: number) {
  return useQuery({
    queryKey: [api.syllabus.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.syllabus.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch syllabus");
      return api.syllabus.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUploadSyllabus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.syllabus.upload.path, {
        method: api.syllabus.upload.method,
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload syllabus");
      return api.syllabus.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.syllabus.list.path] }),
  });
}

export function useParseSyllabus() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.syllabus.parse.path, { id });
      const res = await fetch(url, {
        method: api.syllabus.parse.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to parse syllabus");
      return api.syllabus.parse.responses[200].parse(await res.json());
    },
  });
}
