import { useParams } from "wouter";
import { usePlan, useUpdateTaskStatus } from "@/hooks/use-plans";
import { format, isSameDay } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PlanDetails() {
  const { id } = useParams();
  const { data, isLoading } = usePlan(Number(id));
  const updateTaskMutation = useUpdateTaskStatus();

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  }

  if (!data) return <div className="p-8">Plan not found</div>;

  const { plan, tasks } = data;

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc: any, task: any) => {
    const dateStr = format(new Date(task.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {});

  const dates = Object.keys(tasksByDate).sort();

  const handleTaskToggle = (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Study Schedule</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> Exam: {format(new Date(plan.examDate), 'PPP')}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.dailyHours}h / day</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-muted-foreground">Progress</div>
          <div className="text-2xl font-bold font-display text-primary">
            {Math.round((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          {dates.map((dateStr) => {
            const date = new Date(dateStr);
            const isToday = isSameDay(date, new Date());
            const dayTasks = tasksByDate[dateStr];

            return (
              <div key={dateStr} className="relative pl-8 border-l-2 border-border pb-8 last:pb-0 last:border-0">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-background",
                  isToday ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                
                <h3 className={cn(
                  "text-lg font-bold mb-4", 
                  isToday && "text-primary"
                )}>
                  {format(date, "EEEE, MMMM d")} {isToday && "(Today)"}
                </h3>

                <div className="space-y-3">
                  {dayTasks.map((task: any) => (
                    <Card key={task.id} className="transition-all hover:shadow-md border-border/60">
                      <CardContent className="p-4 flex items-start gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "mt-0.5 shrink-0 hover:bg-transparent",
                            task.status === 'completed' ? "text-green-500" : "text-muted-foreground"
                          )}
                          onClick={() => handleTaskToggle(task)}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium text-base",
                            task.status === 'completed' && "line-through text-muted-foreground"
                          )}>
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="bg-secondary px-2 py-0.5 rounded">
                              {task.durationMinutes} mins
                            </span>
                            {task.isRevision && (
                              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                                Revision
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Summary */}
        <div className="md:col-span-4 space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Today's Summary</h3>
              {/* Logic to filter today's tasks would go here */}
              <p className="text-muted-foreground text-sm">Focus on completing pending tasks to stay on track.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
