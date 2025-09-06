
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Bookmark, ListChecks, SkipForward, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { exams as allExams, questions as allQuestions } from '@/lib/mock-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type QuestionStatus = 'answered' | 'not-answered' | 'marked' | 'not-visited' | 'answered-and-marked';
type Question = typeof allQuestions[string][0];

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const exam = allExams.find(e => e.id === examId);
    const questions = allQuestions[examId] || [];

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [questionStatus, setQuestionStatus] = useState<QuestionStatus[]>(() => 
        Array(questions.length).fill('not-visited')
    );
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(exam ? exam.durationMin * 60 : 0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (questions.length > 0) {
            const newStatus = Array(questions.length).fill('not-visited') as QuestionStatus[];
            newStatus[0] = 'not-answered';
            setQuestionStatus(newStatus);
        }
    }, [questions.length]);

    useEffect(() => {
        if (!timeLeft) {
            handleSubmit();
            return;
        };

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    if (!isMounted) {
        return null; // Or a loading spinner
    }

    if (!exam || questions.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Not Found</CardTitle>
                        <CardDescription>This exam either does not exist or has no questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/">
                            <Button>Go to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];

    const updateStatus = (index: number, newStatus: QuestionStatus, force: boolean = false) => {
        const newQuestionStatus = [...questionStatus];
        const currentStatus = newQuestionStatus[index];

        if (!force) {
            if (currentStatus === 'answered' && newStatus === 'not-answered') return;
            if (currentStatus === 'answered-and-marked' && newStatus === 'not-answered') return;
        }

        newQuestionStatus[index] = newStatus;
        setQuestionStatus(newQuestionStatus);
    };
    
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            if (questionStatus[index] === 'not-visited') {
                updateStatus(index, 'not-answered');
            }
            setCurrentQuestionIndex(index);
        }
    }

    const handleNext = () => {
        goToQuestion(currentQuestionIndex + 1);
    };

    const handlePrevious = () => {
        goToQuestion(currentQuestionIndex - 1);
    };

    const handleSelectOption = (optionIndex: number) => {
        setAnswers({ ...answers, [currentQuestionIndex]: optionIndex });
        const currentStatus = questionStatus[currentQuestionIndex];
        if (currentStatus === 'marked' || currentStatus === 'answered-and-marked') {
            updateStatus(currentQuestionIndex, 'answered-and-marked', true);
        } else {
            updateStatus(currentQuestionIndex, 'answered', true);
        }
    };

    const handleMarkForReview = () => {
        const currentStatus = questionStatus[currentQuestionIndex];
        if (currentStatus === 'answered' || currentStatus === 'answered-and-marked') {
            updateStatus(currentQuestionIndex, 'answered-and-marked');
        } else {
            updateStatus(currentQuestionIndex, 'marked');
        }
        handleNext();
    };

    const handleClearResponse = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentQuestionIndex];
        setAnswers(newAnswers);
        updateStatus(currentQuestionIndex, 'not-answered', true);
    };

    const handleSkip = () => {
        if (questionStatus[currentQuestionIndex] === 'not-visited') {
            updateStatus(currentQuestionIndex, 'not-answered');
        }
        handleNext();
    }

    const handleSaveAndNext = () => {
        // The answer is already saved on selection. This button just moves to the next question.
        handleNext();
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const handleSubmit = () => {
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        let score = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let attemptedQuestions = 0;
        
        questions.forEach((q, index) => {
            const selectedOption = answers[index];
            if (selectedOption !== undefined) {
                attemptedQuestions++;
                if (selectedOption === q.correctOptionIndex) {
                    correctAnswers++;
                    score += 1; // Assuming 1 mark per correct answer
                } else {
                    incorrectAnswers++;
                    score -= exam.negativeMarkPerWrong || 0;
                }
            }
        });

        const results = {
            examId,
            examName: exam.name,
            score: parseFloat(score.toFixed(2)),
            timeTaken,
            totalQuestions: questions.length,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            unansweredQuestions: questions.length - attemptedQuestions,
            accuracy: attemptedQuestions > 0 ? parseFloat(((correctAnswers / attemptedQuestions) * 100).toFixed(2)) : 0,
            answers,
            questions,
            cutoff: exam.cutoff
        };

        sessionStorage.setItem(`exam_results_${examId}`, JSON.stringify(results));
        router.push(`/exam/${examId}/results`);
    };

    const isMarked = questionStatus[currentQuestionIndex] === 'marked' || questionStatus[currentQuestionIndex] === 'answered-and-marked';

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                <h1 className="text-lg font-semibold md:text-xl font-headline">{exam.name}</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-lg">
                        <Clock className="h-5 w-5" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button>Submit</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You still have time remaining. Once you submit, you won't be able to change your answers.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
                <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                                        <CardDescription>Topic: {currentQuestion.topic}</CardDescription>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestionIndex, isMarked ? (answers[currentQuestionIndex] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestionIndex] !== undefined ? 'answered-and-marked' : 'marked') )}>
                                        <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-600' : ''}`} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-6 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                <RadioGroup 
                                    value={answers[currentQuestionIndex]?.toString()}
                                    onValueChange={(value) => handleSelectOption(parseInt(value))}
                                    className="gap-4"
                                >
                                    {currentQuestion.options.map((option, index) => (
                                        <Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 has-[input:checked]:bg-accent/80 has-[input:checked]:border-primary">
                                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                            <span>{option.text}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        <div className="flex justify-between items-center">
                            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={handleClearResponse}>Clear Response</Button>
                                <Button variant="secondary" onClick={handleMarkForReview}>Mark for Review & Next</Button>
                                <Button onClick={handleSaveAndNext} disabled={currentQuestionIndex === questions.length - 1}>Save & Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ListChecks /> Question Palette</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-5 gap-2">
                                {questionStatus.map((status, index) => (
                                    <Button 
                                        key={index} 
                                        variant={currentQuestionIndex === index ? 'default' : 'outline'}
                                        onClick={() => goToQuestion(index)}
                                        className={`
                                            ${currentQuestionIndex !== index && status === 'answered' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 border-green-300 hover:bg-green-300' : ''}
                                            ${currentQuestionIndex !== index && status === 'answered-and-marked' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-blue-300 hover:bg-blue-300' : ''}
                                            ${currentQuestionIndex !== index && status === 'marked' ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 border-purple-400 hover:bg-purple-300' : ''}
                                            ${currentQuestionIndex !== index && status === 'not-answered' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 hover:bg-red-200' : ''}
                                            ${currentQuestionIndex !== index && status === 'not-visited' ? 'bg-muted/50 hover:bg-muted' : ''}
                                        `}
                                        size="icon"
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                               <CardTitle>Legend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Badge className="bg-green-200 hover:bg-green-200 w-6 h-6 p-0"/> Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-red-100 hover:bg-red-100 w-6 h-6 p-0"/> Not Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-purple-200 hover:bg-purple-200 w-6 h-6 p-0"/> Marked for Review</div>
                                <div className="flex items-center gap-2"><Badge className="bg-blue-200 hover:bg-blue-200 w-6 h-6 p-0 flex items-center justify-center"><CheckCircle className="h-3 w-3 text-blue-800"/></Badge> Ans & Marked</div>
                                <div className="flex items-center gap-2"><Badge className="border bg-muted/50 w-6 h-6 p-0"/> Not Visited</div>
                                <div className="flex items-center gap-2"><Badge className="bg-primary w-6 h-6 p-0"/> Current Question</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
