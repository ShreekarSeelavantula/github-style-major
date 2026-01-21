import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePlan } from "@/hooks/use-plans";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  syllabusId: z.coerce.number(),
  startDate: z.date(),
  examDate: z.date(),
  dailyHours: z.coerce.number().min(1).max(12),
});

export default function CreatePlan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const syllabusId = Number(searchParams.get("syllabusId"));
  const pace = searchParams.get("pace") || "Medium";

  const createPlanMutation = useCreatePlan();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      syllabusId,
      startDate: new Date(),
      examDate: addDays(new Date(), 30),
      dailyHours: 2,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const plan = await createPlanMutation.mutateAsync({
        ...values,
        startDate: values.startDate.toISOString(),
        examDate: values.examDate.toISOString(),
      } as any);
      
      toast({ title: "Plan Created", description: "Redirecting to your new schedule..." });
      setLocation(`/plans/${plan.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to create plan" });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-display">Configure Study Plan</CardTitle>
          <CardDescription>
            Based on your assessment, we recommend a <span className="text-primary font-bold">{pace}</span> pace.
            Adjust parameters below to generate your schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Exam Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dailyHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Study Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={12} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Schedule
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
