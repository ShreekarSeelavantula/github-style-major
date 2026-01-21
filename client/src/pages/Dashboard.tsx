import { Link } from "wouter";
import { usePlans } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-profile";
import { Plus, BookOpen, CheckCircle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: plans, isLoading: isPlansLoading } = usePlans();
  const { data: profile } = useUserProfile();

  const activePlans = plans?.filter(p => p.status === 'active') || [];
  
  // Quick stats calculation
  const totalPlans = plans?.length || 0;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! You are learning at a <span className="text-primary font-semibold">{profile?.learningPace || "Medium"}</span> pace.
          </p>
        </div>
        <Link href="/syllabus">
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> New Study Plan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Active Plans" 
          value={activePlans.length} 
          icon={BookOpen} 
          subtitle="Currently in progress"
        />
        <StatsCard 
          title="Total Plans Created" 
          value={totalPlans} 
          icon={Calendar} 
          subtitle="Lifetime"
        />
        {/* Placeholder stat */}
        <StatsCard 
          title="Study Pace" 
          value={profile?.learningPace || "-"} 
          icon={Clock} 
          subtitle="Based on assessment"
        />
      </div>

      {/* Active Plans Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold">Your Study Plans</h2>
        
        {isPlansLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : activePlans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No active plans</h3>
            <p className="text-muted-foreground mb-6">Upload a syllabus to get started.</p>
            <Link href="/syllabus">
              <Button>Create Plan</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, subtitle }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan }: { plan: any }) {
  // Mock progress for visualization since we need to fetch tasks to know real progress
  // In a real app, we'd probably include progress count in the plan list query
  const progress = 35; 

  return (
    <Link href={`/plans/${plan.id}`}>
      <div className="group bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              Study Plan #{plan.id}
            </h3>
            <p className="text-sm text-muted-foreground">
              Exam: {format(new Date(plan.examDate), "MMM d, yyyy")}
            </p>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
            Active
          </div>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </Link>
  );
}
