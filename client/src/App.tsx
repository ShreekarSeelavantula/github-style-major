import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import SyllabusUpload from "@/pages/SyllabusUpload";
import Assessment from "@/pages/Assessment";
import CreatePlan from "@/pages/CreatePlan";
import PlanDetails from "@/pages/PlanDetails";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/syllabus">
        <ProtectedRoute component={SyllabusUpload} />
      </Route>
      <Route path="/assessment">
        <ProtectedRoute component={Assessment} />
      </Route>
      <Route path="/create-plan">
        <ProtectedRoute component={CreatePlan} />
      </Route>
      <Route path="/plans">
        <ProtectedRoute component={Dashboard} /> {/* Reusing Dashboard for plan list for now */}
      </Route>
      <Route path="/plans/:id">
        <ProtectedRoute component={PlanDetails} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
