

'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Award, Clock, HelpCircle, Target, Download, Trophy, ShieldBan, FileText, Percent, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getExamResult, type ExamResult, type Question, getExam, type Exam, type Section } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/app/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type ResultsWithQuestions = ExamResult & {
    id: string;
    questions: Question[];
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const examId = useParams().id as string;
  const { user } = useAuth();
  
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
            const [savedResults, examData] = await Promise.all([
                getExamResult(resultId),
                getExam(examId)
            ]);

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
  
  const sectionalSummary = useMemo(() => {
    if (!results || !exam || !exam.sections || exam.sections.length === 0) {
        return [];
    }

    const sectionMap: Record<string, {
        attempted: number;
        correct: number;
        incorrect: number;
        score: number;
        total: number;
        time: number; // Placeholder for time
    }> = {};

    exam.sections.forEach(section => {
        sectionMap[section.name] = {
            attempted: 0,
            correct: 0,
            incorrect: 0,
            score: 0,
            total: 0,
            time: 0
        };
    });

    results.questions.forEach(q => {
        const sectionName = q.subject;
        if (!sectionMap[sectionName]) return;

        const sectionConfig = exam.sections.find(s => s.name === sectionName);
        const negativeMarkValue = sectionConfig?.negativeMarking ? (sectionConfig.negativeMarkValue || 0) : 0;
        const answer = results.answers[q.id];

        if (q.questionType === 'Reading Comprehension' && q.subQuestions) {
             q.subQuestions.forEach(subQ => {
                sectionMap[sectionName].total++;
                const subAnswer = (answer as Record<string, number>)?.[subQ.id];
                 if (subAnswer !== undefined) {
                    sectionMap[sectionName].attempted++;
                    if (subAnswer === subQ.correctOptionIndex) {
                        sectionMap[sectionName].correct++;
                        sectionMap[sectionName].score += subQ.marks || 1;
                    } else {
                        sectionMap[sectionName].incorrect++;
                        sectionMap[sectionName].score -= negativeMarkValue;
                    }
                }
            });
        } else {
            sectionMap[sectionName].total++;
            if (answer !== undefined) {
                sectionMap[sectionName].attempted++;
                if (answer === q.correctOptionIndex) {
                    sectionMap[sectionName].correct++;
                    sectionMap[sectionName].score += q.marks || 1;
                } else {
                    sectionMap[sectionName].incorrect++;
                    sectionMap[sectionName].score -= negativeMarkValue;
                }
            }
        }
    });

    return Object.entries(sectionMap).map(([name, stats]) => ({
        name,
        ...stats,
        accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
        unseen: stats.total - stats.attempted,
        score: parseFloat(stats.score.toFixed(2)),
    }));

  }, [results, exam]);

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
            if (question.imageUrl) {
                content += `Image: ${question.imageUrl}\n`;
            }
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
        <div className="mx-auto max-w-5xl space-y-8">
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
    <div className="mx-auto max-w-5xl space-y-8">
        <Card>
            <CardHeader className="text-center">
                <h1 className="text-2xl font-bold font-headline tracking-tight">{results.examName}</h1>
                <p className="text-sm text-muted-foreground">Held on {new Date(results.submittedAt.seconds * 1000).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <Trophy className={`w-24 h-24 mb-4 ${isPassed ? 'text-yellow-400' : 'text-muted-foreground/50'}`} />
                <h2 className="text-3xl font-bold">{isPassed ? 'Congratulations!' : 'Oh No!!!'}</h2>
                <p className="text-xl font-semibold text-primary">{user?.displayName}</p>
                <p className="mt-2 text-muted-foreground">
                    {isPassed ? "You have successfully cleared the cut-off!" : "You have not reached the desired cut-off."}
                </p>
                <p className="font-semibold">Your Score: {results.score} | Cut-off: {exam.overallCutoff || 'N/A'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{isPassed ? 'Keep up the great work!' : 'Practice more to get the desired cut-off!'}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-3 lg:grid-cols-6">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                        <FileText className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.score}/{results.maxScore}</span>
                        <span className="text-xs text-muted-foreground">Score</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                        <Target className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.attemptedQuestions}/{results.totalQuestions}</span>
                        <span className="text-xs text-muted-foreground">Attempted</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-green-500/10 p-4 text-green-500">
                        <CheckCircle className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.correctAnswers}</span>
                        <span className="text-xs">Correct</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-red-500/10 p-4 text-red-500">
                        <XCircle className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.incorrectAnswers}</span>
                        <span className="text-xs">Incorrect</span>
                    </div>
                     <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                        <HelpCircle className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.unansweredQuestions}</span>
                        <span className="text-xs text-muted-foreground">Unanswered</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
                        <Percent className="h-6 w-6 mb-2"/>
                        <span className="text-xl font-bold">{results.accuracy}%</span>
                        <span className="text-xs text-muted-foreground">Accuracy</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {sectionalSummary.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Sectional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Section Name</TableHead>
                                <TableHead className="text-center">Attempted</TableHead>
                                <TableHead className="text-center">Correct</TableHead>
                                <TableHead className="text-center">Incorrect</TableHead>
                                <TableHead className="text-center">Unseen</TableHead>
                                <TableHead className="text-center">Accuracy</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sectionalSummary.map(section => (
                                <TableRow key={section.name}>
                                    <TableCell className="font-medium">{section.name}</TableCell>
                                    <TableCell className="text-center">{section.attempted}/{section.total}</TableCell>
                                    <TableCell className="text-center text-green-500">{section.correct}</TableCell>
                                    <TableCell className="text-center text-red-500">{section.incorrect}</TableCell>
                                    <TableCell className="text-center">{section.unseen}</TableCell>
                                    <TableCell className="text-center">{section.accuracy.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right font-semibold">{section.score}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

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
                                {question.imageUrl && (
                                    <div className="my-4">
                                        <Image
                                            src={question.imageUrl}
                                            alt="Question diagram"
                                            width={400}
                                            height={300}
                                            className="rounded-md object-contain"
                                        />
                                    </div>
                                )}
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
    const examId = useParams().id as string;
    return (
         <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                 <h1 className="text-lg font-semibold md:text-xl font-headline">Results Analysis</h1>
                 <div className='flex items-center gap-2'>
                    {examId !== 'custom' && (
                        <Button asChild variant="secondary">
                            <Link href={`/exam/${examId}`}><RefreshCw className="mr-2 h-4 w-4" /> Retake Exam</Link>
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                 </div>
            </header>

            <main className="flex-1 p-4 md:p-8">
                <Suspense fallback={<p>Loading results...</p>}>
                    <ResultsContent />
                </Suspense>
            </main>
        </div>
    )
}
