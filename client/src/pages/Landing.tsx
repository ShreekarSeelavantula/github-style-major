import { Link } from "wouter";
import { BrainCircuit, CheckCircle, ArrowRight, Zap, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">StudyAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/api/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block">
              Log in
            </Link>
            <a href="/api/login">
              <Button>Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-transparent to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-3 h-3" />
            <span>AI-Powered Learning</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Your Personal AI <br /> Study Architect
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your syllabus, assess your knowledge gaps, and get a tailored day-by-day study plan generated instantly by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all">
                Generate My Plan <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
              View Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BookOpen} 
              title="Syllabus Parsing" 
              description="Upload PDFs or images. Our AI extracts topics, subtopics, and requirements automatically using advanced OCR."
            />
            <FeatureCard 
              icon={BrainCircuit} 
              title="Smart Assessment" 
              description="Take an AI-generated quiz to gauge your current knowledge level and adapt the plan to your pace."
            />
            <FeatureCard 
              icon={Clock} 
              title="Adaptive Scheduling" 
              description="Get a dynamic calendar that fits your exam date and daily availability. Falling behind? It readjusts automatically."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 StudyAI. Built with React & AI.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-display mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
