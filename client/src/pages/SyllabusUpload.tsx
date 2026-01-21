import { useState } from "react";
import { useLocation } from "wouter";
import { useUploadSyllabus, useParseSyllabus } from "@/hooks/use-syllabus";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SyllabusUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const uploadMutation = useUploadSyllabus();
  const parseMutation = useParseSyllabus();
  
  const [step, setStep] = useState<"upload" | "parsing" | "complete">("upload");
  const [syllabusId, setSyllabusId] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setStep("parsing");
      // 1. Upload
      const syllabus = await uploadMutation.mutateAsync(formData);
      setSyllabusId(syllabus.id);

      // 2. Parse (Simulated delay if API is fast, to show nice UI)
      toast({ title: "File uploaded", description: "Analyzing content..." });
      
      await parseMutation.mutateAsync(syllabus.id);
      
      setStep("complete");
      toast({ title: "Success", description: "Syllabus parsed successfully!" });
    } catch (error) {
      setStep("upload");
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to process syllabus" 
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold mb-4">Upload Syllabus</h1>
        <p className="text-muted-foreground text-lg">
          We'll analyze your document to understand the topics and difficulty.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5">
        {step === "upload" && (
          <FileUpload 
            onUpload={handleUpload} 
            isUploading={uploadMutation.isPending} 
          />
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-background p-4 rounded-full border border-border shadow-lg">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyzing Content</h3>
            <p className="text-muted-foreground">Extracting topics via OCR & NLP...</p>
          </div>
        )}

        {step === "complete" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-2">Analysis Complete!</h3>
            <p className="text-muted-foreground mb-8">
              We've successfully extracted the topics. Next, let's assess your familiarity.
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-10 text-lg shadow-lg shadow-primary/20"
              onClick={() => setLocation(`/assessment?syllabusId=${syllabusId}`)}
            >
              Take Assessment <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-center mt-12 gap-4">
        <Step active={step === "upload"} completed={step !== "upload"} number={1} label="Upload" />
        <div className="w-12 h-px bg-border self-center" />
        <Step active={step === "parsing"} completed={step === "complete"} number={2} label="Parse" />
        <div className="w-12 h-px bg-border self-center" />
        <Step active={false} completed={false} number={3} label="Assess" />
      </div>
    </div>
  );
}

import { CheckCircle } from "lucide-react";

function Step({ active, completed, number, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
        ${completed 
          ? "bg-primary text-primary-foreground" 
          : active 
            ? "border-2 border-primary text-primary" 
            : "border border-muted-foreground/30 text-muted-foreground"}
      `}>
        {completed ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <span className={`text-xs font-medium ${active || completed ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
