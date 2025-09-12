
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Award, Clock, HelpCircle, Target, Download, Trophy, ShieldBan, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getExamResult, type ExamResult, type Question, getExam, type Exam } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type ResultsWithQuestions = ExamResult & {
    id: string;
    questions: Question[];
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const examId = useParams().id as string;
  
  const [results, setResults] = useState<ResultsWithQuestions | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
        if (!resultId) {
            router.push('/');
            return;
        }
        try {
            const savedResults = await getExamResult(resultId);
            const examData = await getExam(examId);

            if (savedResults && examData) {
                setResults(savedResults);
                setExam(examData);
            } else {
                 router.push('/');
            }
        } catch (error) {
            console.error("Failed to fetch results:", error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    }
    fetchResults();
  }, [resultId, examId, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const handleDownload = () => {
    if (!results || !exam) return;

    let content = `Exam Results: ${results.examName}\n`;
    content += `Submitted on: ${new Date(results.submittedAt.seconds * 1000).toLocaleString()}\n`;
    content += `--------------------------------------------------\n\n`;
    content += `PERFORMANCE SUMMARY\n`;
    content += `Score: ${results.score} / ${results.maxScore}\n`;
    content += `Accuracy: ${results.accuracy}%\n`;
    content += `Time Taken: ${formatTime(results.timeTaken)}\n`;
    content += `Correct Answers: ${results.correctAnswers}\n`;
    content += `Incorrect Answers: ${results.incorrectAnswers}\n`;
    content += `Unanswered: ${results.unansweredQuestions}\n\n`;
    content += `--------------------------------------------------\n\n`;
    content += `DETAILED ANALYSIS\n\n`;

    results.questions.forEach((question, index) => {
        const userAnswer = results.answers[question.id];
        content += `Question ${index + 1}: (${question.subject} - ${question.topic})\n`;

        if (question.questionType === 'Reading Comprehension') {
            content += `Passage: ${question.passage || 'N/A'}\n\n`;
            question.subQuestions?.forEach((subQ, subIndex) => {
                const subQUserAnswerIndex = (userAnswer as Record<string, number>)?.[subQ.id];
                const correctOptionText = subQ.options[subQ.correctOptionIndex]?.text || 'N/A';
                const userAnswerText = subQUserAnswerIndex !== undefined ? subQ.options[subQUserAnswerIndex]?.text : 'Not Answered';
                
                content += `  Sub-Question ${subIndex + 1}: ${subQ.questionText}\n`;
                subQ.options.forEach((opt, i) => {
                  content += `    (${i + 1}) ${opt.text}\n`;
                });
                content += `\n`;
                content += `  Your Answer: ${userAnswerText}\n`;
                content += `  Correct Answer: ${correctOptionText}\n`;
                if (exam.showExplanations && subQ.explanation) {
                    content += `  Explanation: ${subQ.explanation}\n`;
                }
                content += `\n`;
            });

        } else {
            const correctOptionText = question.options?.[question.correctOptionIndex!]?.text || 'N/A';
            const userAnswerText = userAnswer !== undefined ? question.options?.[userAnswer as number]?.text : 'Not Answered';

            content += `${question.questionText}\n`;
            question.options?.forEach((opt, i) => {
              content += `  (${i + 1}) ${opt.text}\n`;
            });
            content += `\n`;
            content += `Your Answer: ${userAnswerText}\n`;
            content += `Correct Answer: ${correctOptionText}\n`;
            if (exam.showExplanations && question.explanation) {
                content += `Explanation: ${question.explanation}\n`;
            }
        }
        content += `--------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${results.examName.replace(/ /g, '_')}_Results.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (isLoading) {
    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="mt-6 space-y-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!results || !exam) {
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

  const isPassed = exam.overallCutoff !== undefined && results.score >= exam.overallCutoff;
  
  return (
    <div className="mx-auto max-w-4xl space-y-8">
        {/* Summary Card */}
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-3xl font-headline">Your Performance</CardTitle>
                        {exam.overallCutoff !== undefined && (
                            <Badge variant={isPassed ? "success" : "destructive"} className="text-lg">
                                {isPassed ? <Trophy className="mr-2 h-5 w-5"/> : <ShieldBan className="mr-2 h-5 w-5"/>}
                                {isPassed ? 'Passed' : 'Failed'}
                            </Badge>
                        )}
                    </div>
                    <CardDescription>A summary of your exam results for {results.examName}.</CardDescription>
                </div>
                 {exam.allowResultDownload && (
                    <Button onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Results
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-5">
            <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                <span className="text-2xl font-bold">{results.score} / {results.maxScore}</span>
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
                <span className="text-2xl font-bold">{results.totalQuestions}</span>
                <span className="text-sm text-muted-foreground">Questions</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                <span className="text-2xl font-bold">{results.attemptedQuestions}</span>
                <span className="text-sm text-muted-foreground">Attempted</span>
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
                 const isRC = question.questionType === 'Reading Comprehension';
                 const userAnswer = results.answers[question.id];

                return (
                <AccordionItem value={`item-${index}`} key={question.id}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between gap-4 pr-4 text-left">
                            <span className="font-medium">Question {index + 1}: <span className="font-normal text-muted-foreground line-clamp-1">{question.questionType === 'Reading Comprehension' ? question.passage : question.questionText}</span></span>
                            <Badge variant="outline">{question.questionType}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 p-2">
                        {isRC ? (
                             <div>
                                {question.passage && <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-4 mb-4 whitespace-pre-wrap">{question.passage}</div>}
                                {question.subQuestions?.map((subQ, subIndex) => {
                                    const subQUserAnswerIndex = (userAnswer as Record<string, number>)?.[subQ.id];
                                    const isSubQCorrect = subQUserAnswerIndex === subQ.correctOptionIndex;
                                    return (
                                        <div key={subQ.id} className="mt-4 pt-4 border-t">
                                            <p className="font-medium">{subIndex + 1}. {subQ.questionText}</p>
                                            {exam.showCorrectAnswers && (
                                                <div className="space-y-2 mt-2">
                                                    {subQ.options.map((option, optionIndex) => {
                                                        const isUserAnswer = optionIndex === subQUserAnswerIndex;
                                                        const isCorrectAnswer = optionIndex === subQ.correctOptionIndex;
                                                        const optionClass = cn("border-secondary", 
                                                            isCorrectAnswer && "border-green-500 bg-green-500/10",
                                                            isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-500/10"
                                                        );
                                                        const icon = isCorrectAnswer ? <CheckCircle className="h-5 w-5 text-green-500" /> : (isUserAnswer && !isCorrectAnswer ? <XCircle className="h-5 w-5 text-red-500" /> : <div className="h-5 w-5" />);
                                                        return (
                                                            <div key={optionIndex} className={`flex items-center gap-3 rounded-lg p-3 border ${optionClass}`}>
                                                                {icon}
                                                                <span>{option.text}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {exam.showExplanations && subQ.explanation && <div className="mt-4 rounded-lg border bg-accent/50 p-4">
                                                <h4 className="font-semibold text-accent-foreground">Explanation</h4>
                                                <p className="text-sm text-foreground/80">{subQ.explanation}</p>
                                            </div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                <p className="font-medium">{question.questionText}</p>
                                {exam.showCorrectAnswers && (
                                    <div className="space-y-2">
                                        {question.options?.map((option, optionIndex) => {
                                            const isCorrect = optionIndex === question.correctOptionIndex;
                                            const isUserAnswer = optionIndex === userAnswer;
                                            const optionClass = cn("border-secondary", 
                                                isCorrect && "border-green-500 bg-green-500/10",
                                                isUserAnswer && !isCorrect && "border-red-500 bg-red-500/10"
                                            );
                                            const icon = isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : (isUserAnswer && !isCorrect ? <XCircle className="h-5 w-5 text-red-500" /> : <div className="h-5 w-5" />);
                                            return (
                                                <div key={optionIndex} className={`flex items-center gap-3 rounded-lg p-3 border ${optionClass}`}>
                                                    {icon}
                                                    <span>{option.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {exam.showExplanations && question.explanation && (
                                    <div className="mt-4 rounded-lg border bg-accent/50 p-4">
                                        <h4 className="font-semibold text-accent-foreground">Explanation</h4>
                                        <p className="text-sm text-foreground/80">{question.explanation}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </AccordionContent>
                </AccordionItem>
                );
            })}
            </Accordion>
        </CardContent>
        </Card>
    </div>
  );
}


export default function ResultsPage() {
    return (
         <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                <div className='flex flex-col'>
                    <h1 className="text-lg font-semibold md:text-xl font-headline">Results Analysis</h1>
                </div>
                <Button asChild>
                <Link href="/">Go to Dashboard</Link>
                </Button>
            </header>

            <main className="flex-1 p-4 md:p-8">
                <Suspense fallback={<p>Loading results...</p>}>
                    <ResultsContent />
                </Suspense>
            </main>
        </div>
    )
}
