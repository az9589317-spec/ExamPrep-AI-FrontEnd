
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Bookmark, ListChecks, SkipForward, CheckCircle, LogIn, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
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
import { cn } from '@/lib/utils';
import { getExam, getQuestionsForExam, saveExamResult, type Exam, type Question } from '@/services/firestore';
import { useAuth } from '@/components/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { signInWithGoogle } from '@/services/auth';
import { ScrollArea } from '@/components/ui/scroll-area';

type QuestionStatus = 'answered' | 'not-answered' | 'marked' | 'not-visited' | 'answered-and-marked';

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();

    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [passage, setPassage] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [questionStatus, setQuestionStatus] = useState<QuestionStatus[]>([]);
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);

    const handleSubmit = async () => {
        if (!user || !exam) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to submit an exam.' });
            return;
        }

        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        let score = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let attemptedQuestions = 0;
        
        questions.forEach((q, index) => {
            if (q.type === 'RC_PASSAGE') return; // Skip passage 'questions' in scoring
            
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
        
        const finalScore = parseFloat(score.toFixed(2));
        const accuracy = attemptedQuestions > 0 ? parseFloat(((correctAnswers / attemptedQuestions) * 100).toFixed(2)) : 0;
        const isPassed = exam.cutoff !== undefined && finalScore >= exam.cutoff;
        const totalScorableQuestions = questions.filter(q => q.type !== 'RC_PASSAGE').length;

        const results = {
            examId,
            examName: exam.name,
            examCategory: exam.category,
            score: finalScore,
            timeTaken,
            totalQuestions: totalScorableQuestions,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            unansweredQuestions: totalScorableQuestions - attemptedQuestions,
            accuracy: accuracy,
            answers,
            cutoff: exam.cutoff,
            passed: isPassed,
            questions: questions, // Denormalize questions into the result
        };

        try {
            const resultId = await saveExamResult(user.uid, results);
            router.push(`/exam/${examId}/results?resultId=${resultId}`);
        } catch (error) {
            console.error("Failed to save exam results:", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Your results could not be saved. Please try again." });
        }
    };
    
    useEffect(() => {
        if (!isLoading && user && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isLoading, user]);

    useEffect(() => {
        if (timeLeft === 0 && !isLoading && user) {
            handleSubmit();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, isLoading, user]);

    useEffect(() => {
        async function fetchExamData() {
            if (!examId) return;
            try {
                const [examData, questionsData] = await Promise.all([
                    getExam(examId),
                    getQuestionsForExam(examId)
                ]);

                if (!examData || questionsData.length === 0) {
                    toast({ variant: "destructive", title: "Error", description: "Exam not found or has no questions." });
                    router.push('/');
                    return;
                }

                setExam(examData);
                setQuestions(questionsData);
                setTimeLeft(examData.durationMin * 60);

                const initialStatus = Array(questionsData.length).fill('not-visited') as QuestionStatus[];
                if (initialStatus.length > 0) {
                    initialStatus[0] = 'not-answered';
                }
                setQuestionStatus(initialStatus);

            } catch (error) {
                console.error("Failed to load exam:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load the exam." });
            } finally {
                setIsLoading(false);
            }
        }

        fetchExamData();
    }, [examId, router, toast]);

    const currentQuestion = useMemo(() => {
        if (!questions || questions.length === 0) return null;
        return questions[currentQuestionIndex];
    }, [questions, currentQuestionIndex]);

    useEffect(() => {
        async function fetchPassage() {
            if (currentQuestion && currentQuestion.parentQuestionId) {
                if (passage?.id !== currentQuestion.parentQuestionId) {
                    const passageDoc = await getDoc(doc(db, 'exams', examId, 'questions', currentQuestion.parentQuestionId));
                    if (passageDoc.exists()) {
                        setPassage({ id: passageDoc.id, ...passageDoc.data() } as Question);
                    }
                }
            } else {
                setPassage(null);
            }
        }
        fetchPassage();
    }, [currentQuestion, examId, passage?.id]);


     useEffect(() => {
        setSelectedOption(answers[currentQuestionIndex]);
    }, [currentQuestionIndex, answers]);
    
    const handleLogin = async () => {
        await signInWithGoogle();
        // The page will reload via the AuthProvider
    };

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                        <div className="flex flex-col gap-6">
                             <Skeleton className="h-96 w-full" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex flex-col gap-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Login Required</CardTitle>
                        <CardDescription>
                            Please log in to start the exam and save your progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleLogin} className="w-full">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!exam || !currentQuestion) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
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

    const updateStatus = (index: number, newStatus: QuestionStatus, force: boolean = false) => {
        setQuestionStatus(prevStatus => {
            const newQuestionStatus = [...prevStatus];
            const currentStatus = newQuestionStatus[index];

            if (!force) {
                if ((currentStatus === 'answered' || currentStatus === 'answered-and-marked') && newStatus === 'not-answered') return prevStatus;
            }

            newQuestionStatus[index] = newStatus;
            return newQuestionStatus;
        });
    };
    
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            if (questionStatus[index] === 'not-visited') {
                updateStatus(index, 'not-answered');
            }
            setCurrentQuestionIndex(index);
            setSelectedOption(answers[index]);
        }
    }

    const handleNext = () => {
        goToQuestion(currentQuestionIndex + 1);
    };

    const handlePrevious = () => {
        goToQuestion(currentQuestionIndex - 1);
    };

    const handleSelectOption = (optionIndex: number) => {
        setSelectedOption(optionIndex);
        const newAnswers = { ...answers, [currentQuestionIndex]: optionIndex };
        setAnswers(newAnswers);
        const currentStatus = questionStatus[currentQuestionIndex];
        if (currentStatus === 'marked' || currentStatus === 'answered-and-marked') {
            updateStatus(currentQuestionIndex, 'answered-and-marked', true);
        } else {
            updateStatus(currentQuestionIndex, 'answered', true);
        }
    };

    const handleMarkForReview = () => {
        const currentStatus = questionStatus[currentQuestionIndex];
        if (answers[currentQuestionIndex] !== undefined) {
             updateStatus(currentQuestionIndex, 'answered-and-marked', true);
        } else {
             updateStatus(currentQuestionIndex, 'marked', true);
        }
        handleNext();
    };

    const handleClearResponse = () => {
        setSelectedOption(undefined);
        const newAnswers = { ...answers };
        delete newAnswers[currentQuestionIndex];
        setAnswers(newAnswers);
        updateStatus(currentQuestionIndex, 'not-answered', true);
    };

    const handleSkip = () => {
        const currentStatus = questionStatus[currentQuestionIndex];
        if (currentStatus === 'not-visited') {
             updateStatus(currentQuestionIndex, 'not-answered');
        }
        handleNext();
    }

    const handleSaveAndNext = () => {
        handleNext();
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const isMarked = questionStatus[currentQuestionIndex] === 'marked' || questionStatus[currentQuestionIndex] === 'answered-and-marked';

    return (
        <div className="flex min-h-screen flex-col">
             <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
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
            <main className="flex-1 p-4 md:p-6 overflow-hidden">
                <div className={cn("grid gap-6 h-full", passage ? "md:grid-cols-2" : "md:grid-cols-[1fr_320px]")}>
                    {passage && (
                         <Card className="flex flex-col">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BookOpen /> Reading Passage</CardTitle>
                             </CardHeader>
                             <CardContent className="flex-1">
                                <ScrollArea className="h-full pr-4">
                                    <p className="text-base leading-relaxed whitespace-pre-wrap">{passage.passage}</p>
                                </ScrollArea>
                             </CardContent>
                         </Card>
                    )}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                                        <CardDescription>Topic: {currentQuestion.topic}</CardDescription>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestionIndex, isMarked ? (answers[currentQuestionIndex] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestionIndex] !== undefined ? 'answered-and-marked' : 'marked'), true )}>
                                        <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-500' : ''}`} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-6 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                <RadioGroup 
                                    value={selectedOption !== undefined ? selectedOption.toString() : undefined}
                                    onValueChange={(value) => handleSelectOption(parseInt(value))}
                                    className="gap-4"
                                >
                                    {currentQuestion.options.map((option, index) => (
                                        <Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary">
                                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                            <span>{option.text}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        <div className="flex items-center justify-between gap-4 mt-auto">
                             <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                             <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" onClick={handleSkip}>Skip</Button>
                                <Button variant="outline" onClick={handleClearResponse}>Clear Response</Button>
                                <Button variant="secondary" onClick={handleMarkForReview}>Mark for Review</Button>
                                
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="default">Submit</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This is the last question. Once you submit, you won't be able to change your answers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button onClick={handleSaveAndNext}>Save &amp; Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={cn("flex flex-col gap-6", passage && "hidden md:flex")}>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ListChecks /> Question Palette</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-5 gap-2">
                                {questionStatus.map((status, index) => {
                                    const isCurrent = currentQuestionIndex === index;
                                    let colorClass = '';
                                    if (isCurrent) {
                                        colorClass = 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary ring-offset-background';
                                    } else {
                                        switch (status) {
                                            case 'answered':
                                                colorClass = 'bg-green-600 text-white hover:bg-green-700';
                                                break;
                                            case 'answered-and-marked':
                                                colorClass = 'bg-sky-600 text-white hover:bg-sky-700';
                                                break;
                                            case 'marked':
                                                colorClass = 'bg-purple-600 text-white hover:bg-purple-700';
                                                break;
                                            case 'not-answered':
                                                colorClass = 'bg-orange-500 text-white hover:bg-orange-600';
                                                break;
                                            case 'not-visited':
                                                colorClass = 'bg-secondary hover:bg-secondary/80';
                                                break;
                                        }
                                    }
                                    
                                    return (
                                        <Button 
                                            key={index} 
                                            variant="outline"
                                            onClick={() => goToQuestion(index)}
                                            className={cn("h-8 w-8 p-0 border-transparent", colorClass)}
                                            size="icon"
                                        >
                                            {index + 1}
                                        </Button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                               <CardTitle>Legend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Badge className="bg-green-600 hover:bg-green-600 w-6 h-6 p-0"/> Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-orange-500 hover:bg-orange-500 w-6 h-6 p-0"/> Not Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-purple-600 hover:bg-purple-600 w-6 h-6 p-0"/> Marked for Review</div>
                                <div className="flex items-center gap-2"><Badge className="bg-sky-600 hover:bg-sky-600 w-6 h-6 p-0 flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white"/></Badge> Answered & Marked</div>
                                <div className="flex items-center gap-2"><Badge className="border bg-secondary w-6 h-6 p-0"/> Not Visited</div>
                                <div className="flex items-center gap-2"><Badge className="bg-primary w-6 h-6 p-0"/> Current Question</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
