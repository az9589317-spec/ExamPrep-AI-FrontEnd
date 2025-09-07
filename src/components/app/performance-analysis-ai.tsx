
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ExamResult } from '@/services/firestore';
import { analyzePerformanceAndSuggestImprovements } from '@/ai/flows/analyze-performance-and-suggest-improvements';
import { Loader2, Wand2 } from 'lucide-react';

interface PerformanceAnalysisAIProps {
  results: ExamResult[];
}

export default function PerformanceAnalysisAI({ results }: PerformanceAnalysisAIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ suggestedTopics: string[]; analysisSummary: string } | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
        const latestResult = results[0];
        const allStrengths = new Set<string>();
        const allWeaknesses = new Set<string>();

        // This logic is simplified. A real app might analyze across many tests.
        // We'll focus on the last test's topics.
        latestResult.questions.forEach((q, index) => {
            const userAnswer = latestResult.answers[index];
            if (userAnswer !== undefined) {
                if (userAnswer === q.correctOptionIndex) {
                    allStrengths.add(q.topic);
                } else {
                    allWeaknesses.add(q.topic);
                }
            }
        });
      
        const input = {
            examCategory: latestResult.examCategory || 'General',
            testType: 'Full-length mock',
            score: latestResult.score,
            timeSpent: Math.round(latestResult.timeTaken / 60),
            strengths: Array.from(allStrengths),
            weaknesses: Array.from(allWeaknesses),
        };

      const analysisResult = await analyzePerformanceAndSuggestImprovements(input);
      setAnalysis(analysisResult);
    } catch (error) {
      console.error("AI analysis failed:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get AI analysis.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleAnalysis} disabled={isLoading} className="w-full">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Analyze My Performance
      </Button>
      {analysis && (
        <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
          <div>
            <h4 className="font-semibold text-primary">Suggested Topics to Focus On:</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {analysis.suggestedTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary">AI Summary:</h4>
            <p className="mt-2 text-sm text-muted-foreground">{analysis.analysisSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
