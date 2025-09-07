
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Award, Clock, HelpCircle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  questionText: string;
  options: { text: string }[];
  correctOptionIndex: number;
  explanation?: string;
  topic: string;
}

interface Results {
  examId: string;
  examName: string;
  score: number;
  timeTaken: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  answers: Record<number, number>;
  questions: Question[];
  cutoff?: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [results, setResults] = useState<Results | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedResults = sessionStorage.getItem(`exam_results_${examId}`);
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      // Handle case where results are not found, maybe redirect
    }
  }, [examId]);

  if (!isMounted) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Results Not Found</CardTitle>
            <CardDescription>We couldn't find the results for this exam. It might have expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };
  
  const isPassed = results.cutoff !== undefined && results.score >= results.cutoff;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
        <div className='flex flex-col'>
            <h1 className="text-lg font-semibold md:text-xl font-headline">{results.examName}</h1>
            <p className="text-sm text-muted-foreground">Results Analysis</p>
        </div>
        <Button asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Summary Card */}
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-3xl font-headline">Your Performance</CardTitle>
                        <CardDescription>A summary of your exam results.</CardDescription>
                    </div>
                    {results.cutoff !== undefined && (
                        <Badge variant={isPassed ? "default" : "destructive"} className={cn("text-lg px-4 py-2", isPassed ? "border-green-600 bg-green-500/10 text-green-400" : "border-red-600 bg-red-500/10 text-red-400")}>
                          {isPassed ? <Award className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
                          {isPassed ? 'Passed' : 'Failed'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                  <span className="text-2xl font-bold">{results.score}</span>
                  <span className="text-sm text-muted-foreground">Score</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                  <span className="text-2xl font-bold">{results.accuracy}%</span>
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                  <span className="text-2xl font-bold">{formatTime(results.timeTaken)}</span>
                  <span className="text-sm text-muted-foreground">Time Taken</span>
                </div>
                 <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                  <span className="text-2xl font-bold">{results.cutoff || 'N/A'}</span>
                  <span className="text-sm text-muted-foreground">Cut-off</span>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-green-500"><CheckCircle className="h-4 w-4" /> Correct</span>
                    <span>{results.correctAnswers}</span>
                </div>
                <Progress value={(results.correctAnswers / results.totalQuestions) * 100} className="h-2 [&>div]:bg-green-500" />
                
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-red-500"><XCircle className="h-4 w-4" /> Incorrect</span>
                    <span>{results.incorrectAnswers}</span>
                </div>
                <Progress value={(results.incorrectAnswers / results.totalQuestions) * 100} className="h-2 [&>div]:bg-red-500" />
                
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /> Unanswered</span>
                    <span>{results.unansweredQuestions}</span>
                </div>
                <Progress value={(results.unansweredQuestions / results.totalQuestions) * 100} className="h-2" />

              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
              <CardDescription>Review each question to understand your mistakes and learn from them.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {results.questions.map((question, index) => {
                  const userAnswerIndex = results.answers[index];
                  const isCorrect = userAnswerIndex === question.correctOptionIndex;
                  const isAttempted = userAnswerIndex !== undefined;
                  
                  let statusBadge;
                  if (isAttempted) {
                    statusBadge = isCorrect 
                      ? <Badge variant="secondary" className="bg-green-500/10 text-green-400">Correct</Badge>
                      : <Badge variant="destructive">Incorrect</Badge>;
                  } else {
                    statusBadge = <Badge variant="outline">Unanswered</Badge>;
                  }

                  return (
                    <AccordionItem value={`item-${index}`} key={question.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between gap-4 pr-4">
                            <span className="text-left">Question {index + 1}</span>
                           {statusBadge}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6 p-2">
                        <p className="font-medium">{question.questionText}</p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isUserAnswer = optionIndex === userAnswerIndex;
                            const isCorrectAnswer = optionIndex === question.correctOptionIndex;
                            
                            let optionClass = "border-secondary";
                            let icon = null;

                            if (isCorrectAnswer) {
                                optionClass = "border-green-500 bg-green-500/10 text-green-300";
                                icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                            }
                            if (isUserAnswer && !isCorrect) {
                                optionClass = "border-red-500 bg-red-500/10 text-red-300";
                                icon = <XCircle className="h-5 w-5 text-red-500" />;
                            }

                            return (
                              <div key={optionIndex} className={`flex items-center gap-3 rounded-lg p-3 border ${optionClass}`}>
                                {icon}
                                <span>{option.text}</span>
                              </div>
                            );
                          })}
                        </div>
                        {question.explanation && (
                            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                                <h4 className="font-semibold text-amber-400">Explanation</h4>
                                <p className="text-sm text-amber-200/80">{question.explanation}</p>
                            </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
