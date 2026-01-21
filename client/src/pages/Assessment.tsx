import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGenerateAssessment, useSubmitAssessment } from "@/hooks/use-assessment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Assessment() {
  const [location] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const syllabusId = Number(searchParams.get("syllabusId"));

  const generateMutation = useGenerateAssessment();
  const submitMutation = useSubmitAssessment();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<any>(null);

  // Auto-generate on mount
  useEffect(() => {
    if (syllabusId && !assessment && !generateMutation.isPending && !generateMutation.isError) {
      generateMutation.mutate(syllabusId, {
        onSuccess: (data) => {
          setAssessment(data);
          setAnswers(new Array(data.questions.length).fill(-1));
          setStartTime(Date.now());
        }
      });
    }
  }, [syllabusId]);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIdx < assessment.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const timeTaken = (Date.now() - startTime) / 1000;
    
    try {
      const res = await submitMutation.mutateAsync({
        id: assessment.id,
        answers,
        timeTakenSeconds: timeTaken
      });
      setResult(res);
    } catch (error) {
      toast({ variant: "destructive", title: "Submission failed" });
    }
  };

  if (generateMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-display font-bold">Generating Questions...</h2>
        <p className="text-muted-foreground mt-2">AI is creating a personalized quiz from your syllabus.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Assessment Complete</h2>
          <p className="text-muted-foreground mb-8">
            You scored <span className="font-bold text-foreground">{result.score}%</span>. 
            We recommend a <span className="font-bold text-primary">{result.determinedPace}</span> study pace.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-muted/50 p-4 rounded-xl">
               <div className="text-sm text-muted-foreground">Score</div>
               <div className="text-2xl font-bold">{result.score}/100</div>
             </div>
             <div className="bg-muted/50 p-4 rounded-xl">
               <div className="text-sm text-muted-foreground">Pace</div>
               <div className="text-2xl font-bold">{result.determinedPace}</div>
             </div>
          </div>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => window.location.href = `/create-plan?syllabusId=${syllabusId}&pace=${result.determinedPace}`}
          >
            Create Study Plan
          </Button>
        </div>
      </div>
    );
  }

  if (!assessment) return <div>Error loading assessment</div>;

  const question = assessment.questions[currentQuestionIdx];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Familiarity Check</h1>
          <p className="text-sm text-muted-foreground">Question {currentQuestionIdx + 1} of {assessment.questions.length}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium bg-muted px-3 py-1 rounded-full">
          <Clock className="w-4 h-4" />
          <span>Timer Active</span>
        </div>
      </div>

      <div className="mb-6 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestionIdx + 1) / assessment.questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-6 md:p-8 shadow-lg">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase mb-2 block">
              {question.topic}
            </span>
            <h3 className="text-xl font-medium mb-8 leading-relaxed">
              {question.question}
            </h3>

            <RadioGroup 
              value={answers[currentQuestionIdx]?.toString()} 
              onValueChange={(val) => handleAnswer(parseInt(val))}
              className="space-y-4"
            >
              {question.options.map((option: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} className="peer sr-only" />
                  <Label 
                    htmlFor={`opt-${idx}`}
                    className={`
                      flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all
                      peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                      hover:border-primary/50 hover:bg-muted/50
                      ${answers[currentQuestionIdx] === idx ? "border-primary bg-primary/5" : "border-border"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                        ${answers[currentQuestionIdx] === idx ? "border-primary bg-primary text-white" : "border-muted-foreground/30"}
                      `}>
                        {answers[currentQuestionIdx] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-base">{option}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-end">
        <Button 
          size="lg" 
          onClick={handleNext}
          disabled={answers[currentQuestionIdx] === -1}
          className="px-8"
        >
          {currentQuestionIdx === assessment.questions.length - 1 ? "Submit Assessment" : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
