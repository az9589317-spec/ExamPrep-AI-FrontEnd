

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Bookmark, ListChecks, CheckCircle, BookOpen, LogIn, Eye, Loader2 } from 'lucide-react';
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
import { getExam, getQuestionsForExam, saveExamResult, type Exam, type Question, Section } from '@/services/firestore';
import { useAuth } from '@/components/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { signInWithGoogle } from '@/services/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GenerateCustomMockExamOutput } from '@/ai/flows/generate-custom-mock-exam';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type QuestionStatus = 'answered' | 'not-answered' | 'marked' | 'not-visited' | 'answered-and-marked';
type Answer = number | Record<string, number>;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

type GroupedQuestion = Question & { originalIndex: number };

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();

    const [exam, setExam] = useState<Exam | null>(null);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [groupedQuestions, setGroupedQuestions] = useState<Record<string, GroupedQuestion[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const [activeSection, setActiveSection] = useState<string>('');
    const [currentQuestionIndexInSection, setCurrentQuestionIndexInSection] = useState(0);
    const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);

    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [questionStatus, setQuestionStatus] = useState<QuestionStatus[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mobileTab, setMobileTab] = useState<'question' | 'palette'>('question');

     const handleSubmit = useCallback(async () => {
        if (isSubmitting || !user || !exam) {
            if (!user) toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to submit an exam.' });
            return;
        }
        setIsSubmitting(true);

        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        let score = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let attemptedQuestions = 0;
        let unansweredQuestions = 0;
        let totalSubQuestions = 0;

        const sectionsByName: Record<string, Section> = (exam.sections || []).reduce((acc, sec) => {
            acc[sec.name] = sec;
            return acc;
        }, {} as Record<string, Section>);

        allQuestions.forEach(q => {
            const answer = answers[q.id];
            const sectionConfig = sectionsByName[q.subject];
            const negativeMarkValue = sectionConfig?.negativeMarking ? (sectionConfig.negativeMarkValue || 0) : 0;

            if (q.questionType === 'Reading Comprehension' && q.subQuestions) {
                totalSubQuestions += q.subQuestions.length;
                q.subQuestions.forEach(subQ => {
                    const subAnswer = (answer as Record<string, number>)?.[subQ.id];
                    if (subAnswer !== undefined) {
                        attemptedQuestions++;
                        if (subAnswer === subQ.correctOptionIndex) {
                            correctAnswers++;
                            score += subQ.marks || 1; 
                        } else {
                            incorrectAnswers++;
                            score -= negativeMarkValue;
                        }
                    } else {
                        unansweredQuestions++;
                    }
                });
            } else if (q.questionType === 'Standard') {
                totalSubQuestions++;
                if (answer !== undefined) {
                    attemptedQuestions++;
                    if (answer === q.correctOptionIndex) {
                        correctAnswers++;
                        score += q.marks || 1;
                    } else {
                        incorrectAnswers++;
                        score -= negativeMarkValue;
                    }
                } else {
                    unansweredQuestions++;
                }
            }
        });

        const finalScore = parseFloat(score.toFixed(2));
        const accuracy = attemptedQuestions > 0 ? parseFloat(((correctAnswers / attemptedQuestions) * 100).toFixed(2)) : 0;

        const results = {
            examId,
            examName: exam.name,
            examCategory: exam.category,
            score: finalScore,
            maxScore: exam.totalMarks,
            timeTaken,
            totalQuestions: totalSubQuestions,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            unansweredQuestions,
            accuracy,
            answers,
            questions: allQuestions,
        };

        try {
            const resultId = await saveExamResult(user.uid, results as any);
            router.push(`/exam/${examId}/results?resultId=${resultId}`);
        } catch (error) {
            console.error("Failed to save exam results:", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Your results could not be saved. Please try again." });
            setIsSubmitting(false);
        }
    }, [user, exam, startTime, allQuestions, answers, router, toast, examId, isSubmitting]);

    useEffect(() => {
        async function fetchExamData() {
            setIsLoading(true);
            if (!examId) return;

            let examData: Exam | null = null;
            let questionsData: Question[] = [];

            if (examId === 'custom') {
                const customExamData = sessionStorage.getItem('customExam');
                if (customExamData) {
                    const parsedExam: GenerateCustomMockExamOutput = JSON.parse(customExamData);
                    examData = {
                        id: 'custom',
                        name: 'Custom Mock Exam',
                        category: parsedExam.questions[0]?.subject || 'Custom',
                        durationMin: 20,
                        totalQuestions: parsedExam.questions.length,
                        totalMarks: parsedExam.questions.reduce((acc, q) => acc + (q.marks || 1), 0),
                        status: 'published',
                        examType: 'Custom',
                        sections: [],
                        hasOverallTimer: true,
                        hasSectionTimer: false,
                        allowBackNavigation: true,
                        autoSubmit: true,
                        showResults: true,
                        allowReAttempt: true,
                        passingCriteria: 'overall',
                        showCorrectAnswers: true,
                        showExplanations: true,
                        randomizeOptions: false,
                        fullScreenMode: false,
                        tabSwitchDetection: false,
                        lockBrowser: false,
                        preventCopyPaste: false,
                        requireProctoring: false,
                        allowResultDownload: false,
                        showQuestionNumbers: true,
                        questions: parsedExam.questions.length,
                        createdAt: new Date() as any,
                        startTime: null,
                        endTime: null,
                        subCategory: ['Custom'],
                    };
                    
                    questionsData = parsedExam.questions.map((q, i) => ({
                        ...q,
                        id: `custom-q-${i}`,
                        examId: 'custom',
                        options: Array.isArray(q.options) ? q.options.map(opt => (typeof opt === 'string' ? { text: opt } : opt)) : [],
                        createdAt: new Date() as any,
                    }));
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Custom exam data not found." });
                    router.push('/');
                    setIsLoading(false);
                    return;
                }
            } else {
                try {
                    [examData, questionsData] = await Promise.all([
                        getExam(examId),
                        getQuestionsForExam(examId)
                    ]);
                } catch (error) {
                    console.error("Failed to load exam:", error);
                    toast({ variant: "destructive", title: "Error", description: "Could not load the exam." });
                    router.push('/');
                    setIsLoading(false);
                    return;
                }
            }

            if (!examData || questionsData.length === 0) {
                toast({ variant: "destructive", title: "Error", description: "Exam not found or has no questions." });
                router.push('/');
                setIsLoading(false);
                return;
            }

            if (examData.randomizeOptions) {
                questionsData = questionsData.map(q => {
                    if (q.questionType === 'Standard' && q.options) {
                        const originalOptions = [...q.options];
                        const correctOriginalIndex = q.correctOptionIndex!;
                        const correctAnswer = originalOptions[correctOriginalIndex];
                        const shuffledOptions = shuffleArray(originalOptions);
                        const newCorrectIndex = shuffledOptions.findIndex(opt => opt.text === correctAnswer.text);
                        return { ...q, options: shuffledOptions, correctOptionIndex: newCorrectIndex };
                    }
                    return q;
                });
            }

            setExam(examData);
            setAllQuestions(questionsData);
            setTimeLeft(examData.durationMin * 60);
            setStartTime(Date.now());

            const grouped = questionsData.reduce((acc, question, index) => {
                const section = question.subject || 'General';
                if (!acc[section]) {
                    acc[section] = [];
                }
                acc[section].push({ ...question, originalIndex: index });
                return acc;
            }, {} as Record<string, GroupedQuestion[]>);

            const initialSection = Object.keys(grouped)[0];
            setGroupedQuestions(grouped);
            setActiveSection(initialSection);

            const initialStatus = Array(questionsData.length).fill('not-visited') as QuestionStatus[];
            setQuestionStatus(initialStatus);

            setIsLoading(false);
        }

        fetchExamData();
    }, [examId, router, toast]);

    useEffect(() => {
        if (!isLoading && user && exam?.hasOverallTimer && timeLeft > 0 && startTime > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isLoading, user, startTime, exam?.hasOverallTimer]);

    useEffect(() => {
        if (exam?.autoSubmit && timeLeft === 0 && !isLoading && user && startTime > 0) {
            handleSubmit();
        }
    }, [timeLeft, isLoading, user, startTime, exam?.autoSubmit, handleSubmit]);

    useEffect(() => {
        if (isLoading || !exam) return;
        const handleVisibilityChange = () => { if (document.hidden && exam.tabSwitchDetection) { toast({ variant: 'destructive', title: 'Warning: Tab Switch Detected', description: 'You have navigated away from the exam tab. This attempt may be flagged.', duration: 5000 }); } };
        const handleFullscreenChange = () => { if (!document.fullscreenElement && exam.fullScreenMode) { toast({ variant: 'destructive', title: 'Warning: Fullscreen Exited', description: 'You have exited fullscreen mode. Please re-enter to continue.', duration: 5000 }); } };
        if (exam.fullScreenMode) { document.documentElement.requestFullscreen().catch(err => console.warn(`Error attempting to enable fullscreen: ${err.message} (${err.name})`)); document.addEventListener('fullscreenchange', handleFullscreenChange); }
        if (exam.tabSwitchDetection) { document.addEventListener('visibilitychange', handleVisibilityChange); }
        return () => {
            if (exam.fullScreenMode) { document.removeEventListener('fullscreenchange', handleFullscreenChange); if(document.fullscreenElement) document.exitFullscreen(); }
            if (exam.tabSwitchDetection) { document.removeEventListener('visibilitychange', handleVisibilityChange); }
        }
    }, [isLoading, exam, toast]);

    const handleLogin = async () => {
        await signInWithGoogle();
    };
    
    const currentSectionQuestions = useMemo(() => groupedQuestions[activeSection] || [], [groupedQuestions, activeSection]);
    const currentQuestion = useMemo(() => currentSectionQuestions[currentQuestionIndexInSection], [currentSectionQuestions, currentQuestionIndexInSection]);
    const currentSubQuestion = useMemo(() => {
        if (currentQuestion?.questionType === 'Reading Comprehension' && currentQuestion.subQuestions) {
            return currentQuestion.subQuestions[currentSubQuestionIndex];
        }
        return null;
    }, [currentQuestion, currentSubQuestionIndex]);


    const updateStatus = useCallback((index: number, newStatus: QuestionStatus, force: boolean = false) => {
        setQuestionStatus(prevStatus => {
            const newQuestionStatus = [...prevStatus];
            const currentStatus = newQuestionStatus[index];
            if (!force && (currentStatus === 'answered' || currentStatus === 'answered-and-marked') && newStatus === 'not-answered') return prevStatus;
            newQuestionStatus[index] = newStatus;
            return newQuestionStatus;
        });
    }, []);

     useEffect(() => {
        if (currentQuestion) {
            const currentOriginalIndex = currentQuestion.originalIndex;
            if (questionStatus[currentOriginalIndex] === 'not-visited') {
                updateStatus(currentOriginalIndex, 'not-answered');
            }
        }
    }, [currentQuestion, questionStatus, updateStatus]);


    if (isLoading || isAuthLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex items-center gap-4"><Skeleton className="h-6 w-20" /><Skeleton className="h-9 w-24" /></div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                        <div className="flex flex-col gap-6"><Skeleton className="h-96 w-full" /><Skeleton className="h-10 w-full" /></div>
                        <div className="flex flex-col gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle className="text-2xl font-headline">Login Required</CardTitle><CardDescription>Please log in to start the exam and save your progress.</CardDescription></CardHeader>
                    <CardContent><Button onClick={handleLogin} className="w-full"><LogIn className="mr-2 h-4 w-4" />Sign in with Google</Button></CardContent>
                </Card>
            </div>
        )
    }
    
    if (!exam || !currentQuestion) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Card>
                    <CardHeader><CardTitle>Exam Not Found</CardTitle><CardDescription>This exam either does not exist or has no questions.</CardDescription></CardHeader>
                    <CardContent><Link href="/"><Button>Go to Dashboard</Button></Link></CardContent>
                </Card>
            </div>
        )
    }

    const currentAnswer = answers[currentQuestion.id];
    
    const goToQuestion = (sectionIndex: number, subIndex?: number) => {
        if (sectionIndex >= 0 && sectionIndex < currentSectionQuestions.length) {
            setCurrentQuestionIndexInSection(sectionIndex);
            setCurrentSubQuestionIndex(subIndex || 0);
            setMobileTab('question');
        }
    }

    const handleNext = () => {
        if (currentQuestion.questionType === 'Reading Comprehension' && currentQuestion.subQuestions && currentSubQuestionIndex < currentQuestion.subQuestions.length - 1) {
            setCurrentSubQuestionIndex(prev => prev + 1);
        } else if (currentQuestionIndexInSection < currentSectionQuestions.length - 1) {
             goToQuestion(currentQuestionIndexInSection + 1);
        } else {
            handleNextSection();
        }
    };
    
    const handlePrevious = () => {
        if (!exam.allowBackNavigation) return;

        if (currentQuestion.questionType === 'Reading Comprehension' && currentSubQuestionIndex > 0) {
            setCurrentSubQuestionIndex(prev => prev - 1);
        } else {
            goToQuestion(currentQuestionIndexInSection - 1);
        }
    };

    const handleNextSection = () => {
        const sectionNames = Object.keys(groupedQuestions);
        const currentSectionIndex = sectionNames.indexOf(activeSection);
        if (currentSectionIndex < sectionNames.length - 1) {
            const nextSection = sectionNames[currentSectionIndex + 1];
            onSectionChange(nextSection);
        }
    }
    
    const handleSaveAndNext = () => {
        handleNext();
    }

    const handleSelectOption = (questionId: string, optionIndex: number, subQuestionId?: string) => {
        const newAnswers = { ...answers };
        if (subQuestionId) {
            const currentRCAnswer = (newAnswers[questionId] || {}) as Record<string, number>;
            currentRCAnswer[subQuestionId] = optionIndex;
            newAnswers[questionId] = currentRCAnswer;
        } else {
            newAnswers[questionId] = optionIndex;
        }
        setAnswers(newAnswers);
        
        const currentStatus = questionStatus[currentQuestion.originalIndex];
        if (currentStatus === 'marked' || currentStatus === 'answered-and-marked') {
            updateStatus(currentQuestion.originalIndex, 'answered-and-marked', true);
        } else {
            updateStatus(currentQuestion.originalIndex, 'answered', true);
        }
    };

    const handleMarkForReview = () => {
        const currentStatus = questionStatus[currentQuestion.originalIndex];
        if (answers[currentQuestion.id] !== undefined) {
             updateStatus(currentQuestion.originalIndex, 'answered-and-marked', true);
        } else {
             updateStatus(currentQuestion.originalIndex, 'marked', true);
        }
        handleSaveAndNext();
    };

    const handleClearResponse = () => {
        const newAnswers = { ...answers };
        if (currentSubQuestion) {
            if (newAnswers[currentQuestion.id]) {
                delete (newAnswers[currentQuestion.id] as Record<string, number>)[currentSubQuestion.id];
            }
        } else {
            delete newAnswers[currentQuestion.id];
        }
        setAnswers(newAnswers);
        
        // Only update status to not-answered if no other sub-questions are answered for RC
        if (currentQuestion.questionType === 'Reading Comprehension') {
            if (Object.keys(newAnswers[currentQuestion.id] || {}).length === 0) {
                updateStatus(currentQuestion.originalIndex, 'not-answered', true);
            }
        } else {
            updateStatus(currentQuestion.originalIndex, 'not-answered', true);
        }
    };


    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const isMarked = questionStatus[currentQuestion.originalIndex] === 'marked' || questionStatus[currentQuestion.originalIndex] === 'answered-and-marked';

    const flatQuestionList = useMemo(() => {
        const flatList: { qIndex: number; subQIndex?: number; label: string }[] = [];
        currentSectionQuestions.forEach((q, qIndex) => {
            if (q.questionType === 'Reading Comprehension' && q.subQuestions) {
                q.subQuestions.forEach((subQ, subQIndex) => {
                    flatList.push({ qIndex, subQIndex, label: `${qIndex + 1}.${subQIndex + 1}` });
                });
            } else {
                flatList.push({ qIndex, label: `${qIndex + 1}` });
            }
        });
        return flatList;
    }, [currentSectionQuestions]);

    const Palette = () => (
        <>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks /> Question Palette</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-5 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {flatQuestionList.map(({ qIndex, subQIndex, label }, index) => {
                        const question = currentSectionQuestions[qIndex];
                        const status = questionStatus[question.originalIndex];
                        
                        const isCurrent = currentQuestionIndexInSection === qIndex && (subQIndex === undefined || currentSubQuestionIndex === subQIndex);
                        let colorClass = '';
                        if (isCurrent) { 
                            colorClass = 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary ring-offset-background';
                        } else { 
                            switch (status) {
                                case 'answered': colorClass = 'bg-green-600 text-white hover:bg-green-700'; break;
                                case 'answered-and-marked': colorClass = 'bg-sky-600 text-white hover:bg-sky-700'; break;
                                case 'marked': colorClass = 'bg-purple-600 text-white hover:bg-purple-700'; break;
                                case 'not-answered': colorClass = 'bg-orange-500 text-white hover:bg-orange-600'; break;
                                default: colorClass = 'bg-secondary hover:bg-secondary/80'; break;
                            } 
                        }
                        return (<Button key={index} variant="outline" onClick={() => goToQuestion(qIndex, subQIndex)} className={cn("h-8 w-8 p-0 border-transparent text-xs", colorClass)}>{exam.showQuestionNumbers ? label : ''}</Button>);
                    })}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Legend</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2"><Badge className="bg-green-600 hover:bg-green-600 w-6 h-6 p-0"/> Answered</div>
                    <div className="flex items-center gap-2"><Badge className="bg-orange-500 hover:bg-orange-500 w-6 h-6 p-0"/> Not Answered</div>
                    <div className="flex items-center gap-2"><Badge className="bg-purple-600 hover:bg-purple-600 w-6 h-6 p-0"/> Marked</div>
                    <div className="flex items-center gap-2"><Badge className="bg-sky-600 hover:bg-sky-600 w-6 h-6 p-0 flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white"/></Badge> Answered & Marked</div>
                    <div className="flex items-center gap-2"><Badge className="border bg-secondary w-6 h-6 p-0"/> Not Visited</div>
                    <div className="flex items-center gap-2"><Badge className="bg-primary w-6 h-6 p-0"/> Current</div>
                </CardContent>
            </Card>
        </>
    );
    
    const onSectionChange = (section: string) => {
        setActiveSection(section);
        setCurrentQuestionIndexInSection(0);
        setCurrentSubQuestionIndex(0);
    }

    const isLastSection = Object.keys(groupedQuestions).indexOf(activeSection) === Object.keys(groupedQuestions).length - 1;
    const isLastQuestionOfSection = currentQuestionIndexInSection === currentSectionQuestions.length - 1;
    const isLastSubQuestion = !currentSubQuestion || currentSubQuestionIndex === (currentQuestion.subQuestions?.length ?? 0) - 1;
    const isLastQuestionOfExam = isLastSection && isLastQuestionOfSection && isLastSubQuestion;

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                <div className='flex items-center gap-2'>
                    <Link href="/" className='md:hidden'><Button variant='ghost' size='icon'><ChevronLeft /></Button></Link>
                    <h1 className="text-lg font-semibold truncate md:text-xl font-headline">{exam.name}</h1>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    {exam.hasOverallTimer && (<div className="flex items-center gap-2 font-mono text-base md:text-lg"><Clock className="h-5 w-5" /><span>{formatTime(timeLeft)}</span></div>)}
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" disabled={isSubmitting}>Submit</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle><AlertDialogDescription>You still have time remaining. Once you submit, you won't be able to change your answers.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden p-2 pt-0 md:p-6 md:pt-2">
                 <Tabs value={activeSection} onValueChange={onSectionChange} className="w-full md:hidden mt-2">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <TabsList className="inline-flex h-auto">
                        {Object.keys(groupedQuestions).map(section => (
                                <TabsTrigger key={section} value={section}>
                                    {section}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>
                </Tabs>
                <div className="hidden md:grid gap-6 h-full mt-4 md:grid-cols-[1fr_320px]">
                    
                    <div className="flex flex-col gap-6">
                        <Tabs value={activeSection} onValueChange={onSectionChange}>
                             <TabsList>
                                {Object.keys(groupedQuestions).map(section => (
                                    <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <Card className="flex flex-col flex-1 overflow-hidden">
                             <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        {exam.showQuestionNumbers && <CardTitle>
                                            Question {currentQuestionIndexInSection + 1}
                                            {currentSubQuestion && `.${currentSubQuestionIndex + 1}`}
                                        </CardTitle>}
                                        <div className="flex items-center gap-x-4 text-sm text-muted-foreground mt-1">
                                            <span>Topic: {currentQuestion.topic}</span><Badge variant="outline">{currentQuestion.questionType}</Badge>
                                            {currentQuestion.questionType === 'Standard' && <span>Marks: {currentQuestion.marks || 1}</span>}
                                            {currentSubQuestion && <span>Marks: {currentSubQuestion.marks || 1}</span>}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestion.originalIndex, isMarked ? (answers[currentQuestion.id] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestion.id] !== undefined ? 'answered-and-marked' : 'marked'), true )}>
                                        <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-500' : ''}`} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <ScrollArea className="h-full pr-4">
                                     {currentQuestion.questionType === 'Reading Comprehension' && currentQuestion.passage && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-4 mb-4 whitespace-pre-wrap">
                                            <h4 className='font-bold mb-2'>Passage</h4>
                                            <p>{currentQuestion.passage}</p>
                                            {currentQuestion.imageUrl && (
                                                <div className="my-4">
                                                    <Image
                                                        src={currentQuestion.imageUrl}
                                                        alt="Passage diagram"
                                                        width={400}
                                                        height={300}
                                                        className="rounded-md object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentQuestion.questionType === 'Standard' && (<>
                                        <p className="mb-4 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                        {currentQuestion.imageUrl && (
                                            <div className="my-4">
                                                <Image
                                                    src={currentQuestion.imageUrl}
                                                    alt="Question diagram"
                                                    width={400}
                                                    height={300}
                                                    className="rounded-md object-contain"
                                                />
                                            </div>
                                        )}
                                        <RadioGroup key={currentQuestion.id} value={(currentAnswer ?? '').toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value))} className="gap-4">
                                            {currentQuestion.options?.map((option, index) => (<Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary"><RadioGroupItem value={index.toString()} id={`option-${index}`} /><span>{option.text}</span></Label>))}
                                        </RadioGroup>
                                    </>)}
                                    
                                    {currentSubQuestion && (<div className="space-y-6">
                                        <div key={currentSubQuestion.id} className="pt-4 border-t first:border-t-0 first:pt-0">
                                            <p className="font-semibold">{currentSubQuestion.questionText}</p>
                                            <RadioGroup key={currentSubQuestion.id} value={((currentAnswer as Record<string, number>)?.[currentSubQuestion.id] ?? '').toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value), currentSubQuestion.id)} className="gap-4 mt-2">
                                                {currentSubQuestion.options.map((option, optionIndex) => (<Label key={optionIndex} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary text-sm"><RadioGroupItem value={optionIndex.toString()} id={`sub-option-${currentSubQuestionIndex}-${optionIndex}`} /><span>{option.text}</span></Label>))}
                                            </RadioGroup>
                                        </div>
                                    </div>)}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <div className="flex items-center justify-between gap-4 mt-auto">
                            <Button variant="outline" onClick={handlePrevious} disabled={(currentQuestionIndexInSection === 0 && currentSubQuestionIndex === 0) || !exam.allowBackNavigation}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            <div className="flex items-center justify-end gap-2 ml-auto">
                                <Button variant="secondary" onClick={() => handleSaveAndNext()}>Skip</Button>
                                <Button variant="outline" onClick={handleClearResponse}>Clear Response</Button>
                                <Button variant="secondary" onClick={handleMarkForReview}>Mark & Next</Button>
                                {isLastQuestionOfExam ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="default" disabled={isSubmitting}>Submit Exam</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Final Submission</AlertDialogTitle><AlertDialogDescription>You are about to submit the exam. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Submit
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : isLastQuestionOfSection && isLastSubQuestion ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="default">Save & Next Section</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>End of Section</AlertDialogTitle><AlertDialogDescription>You have reached the end of this section. Move to the next one?</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Stay</AlertDialogCancel><AlertDialogAction onClick={handleNextSection}>Next Section</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button onClick={() => handleSaveAndNext()}>Save & Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6"><Palette /></div>
                </div>

                <div className="md:hidden flex flex-col h-full pt-2">
                    <div className='flex-1 overflow-y-auto -m-2 p-2'>
                        {mobileTab === 'question' && (
                             <Card className="shadow-none border-none bg-transparent">
                                {currentQuestion.questionType === 'Reading Comprehension' && currentQuestion.passage && (
                                    <Card className="mb-4">
                                        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen /> Reading Passage</CardTitle></CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion.passage}</p>
                                            {currentQuestion.imageUrl && (
                                                <div className="my-4">
                                                    <Image
                                                        src={currentQuestion.imageUrl}
                                                        alt="Passage diagram"
                                                        width={400}
                                                        height={300}
                                                        className="rounded-md object-contain"
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {exam.showQuestionNumbers && <CardTitle>
                                                Question {currentQuestionIndexInSection + 1}
                                                {currentSubQuestion && `.${currentSubQuestionIndex + 1}`}
                                            </CardTitle>}
                                            <div className="flex items-center gap-x-4 text-sm text-muted-foreground mt-1">
                                                <Badge variant="outline">{currentQuestion.questionType}</Badge>
                                                {currentQuestion.questionType === 'Standard' && <span>Marks: {currentQuestion.marks || 1}</span>}
                                                {currentSubQuestion && <span>Marks: {currentSubQuestion.marks || 1}</span>}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestion.originalIndex, isMarked ? (answers[currentQuestion.id] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestion.id] !== undefined ? 'answered-and-marked' : 'marked'), true )}>
                                            <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-500' : ''}`} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {currentQuestion.questionType === 'Standard' && (<>
                                        <p className="mb-4 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                        {currentQuestion.imageUrl && (
                                            <div className="my-4">
                                                <Image
                                                    src={currentQuestion.imageUrl}
                                                    alt="Question diagram"
                                                    width={400}
                                                    height={300}
                                                    className="rounded-md object-contain"
                                                />
                                            </div>
                                        )}
                                        <RadioGroup key={currentQuestion.id} value={(currentAnswer ?? '').toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value))} className="gap-4">
                                            {currentQuestion.options?.map((option, index) => (<Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary"><RadioGroupItem value={index.toString()} id={`option-mob-${index}`} /><span>{option.text}</span></Label>))}
                                        </RadioGroup>
                                    </>)}
                                    {currentSubQuestion && (<div className="space-y-6">
                                        <div key={currentSubQuestion.id} className="pt-4 border-t first:border-t-0 first:pt-0">
                                            <div className="flex items-center justify-between mb-4"><p className="font-semibold">{currentSubQuestion.questionText}</p><Badge variant="secondary">Marks: {currentSubQuestion.marks || 1}</Badge></div>
                                            <RadioGroup key={currentSubQuestion.id} value={((currentAnswer as Record<string, number>)?.[currentSubQuestion.id] ?? '').toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value), currentSubQuestion.id)} className="gap-4">
                                                {currentSubQuestion.options.map((option, optionIndex) => (<Label key={optionIndex} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary text-sm"><RadioGroupItem value={optionIndex.toString()} id={`sub-option-mob-${currentSubQuestionIndex}-${optionIndex}`} /><span>{option.text}</span></Label>))}
                                            </RadioGroup>
                                        </div>
                                    </div>)}
                                </CardContent>
                            </Card>
                        )}
                        {mobileTab === 'palette' && (<div className="flex flex-col gap-6"><Palette /></div>)}
                    </div>

                    <div className='flex flex-col gap-2 pt-2 mt-auto'>
                         <div className="flex items-center justify-between gap-2">
                             <Button variant="outline" size="sm" onClick={handlePrevious} disabled={(currentQuestionIndexInSection === 0 && currentSubQuestionIndex === 0) || !exam.allowBackNavigation}><ChevronLeft className="mr-1 h-4 w-4" /> Prev</Button>
                             <div className="flex items-center justify-end gap-1"><Button variant="secondary" size="sm" onClick={handleClearResponse}>Clear</Button><Button variant="secondary" size="sm" onClick={handleMarkForReview}>Mark</Button></div>
                             {isLastQuestionOfExam ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="default" size="sm" disabled={isSubmitting}>Submit</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This is the last question. Once you submit, you can't change answers.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (<Button onClick={() => handleSaveAndNext()} size="sm">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>)}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={mobileTab === 'question' ? 'default' : 'outline'} onClick={() => setMobileTab('question')}><Eye className="mr-2 h-4 w-4"/> Question</Button>
                            <Button variant={mobileTab === 'palette' ? 'default' : 'outline'} onClick={() => setMobileTab('palette')}><ListChecks className="mr-2 h-4 w-4"/> Palette</Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
    
    

    







