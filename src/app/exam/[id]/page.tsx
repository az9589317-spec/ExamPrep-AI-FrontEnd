
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Bookmark, ListChecks, CheckCircle, BookOpen, LogIn, Eye } from 'lucide-react';
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

        allQuestions.forEach(q => {
            const answer = answers[q.id];
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
                        }
                    } else {
                        unansweredQuestions++;
                    }
                });
            } else if (q.questionType === 'Standard') {
                totalSubQuestions++; // Each standard question is one "sub-question"
                if (answer !== undefined) {
                    attemptedQuestions++;
                    if (answer === q.correctOptionIndex) {
                        correctAnswers++;
                        score += q.marks || 1;
                    } else {
                        incorrectAnswers++;
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
                        options: q.options.map(opt => ({ text: opt })),
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
    const isPassage = currentQuestion.questionType === 'Reading Comprehension';
    
    const goToQuestion = (sectionIndex: number) => {
        if (sectionIndex >= 0 && sectionIndex < currentSectionQuestions.length) {
            setCurrentQuestionIndexInSection(sectionIndex);
            setMobileTab('question');
        }
    }

    const handleNext = () => goToQuestion(currentQuestionIndexInSection + 1);
    const handleSaveAndNext = () => handleNext();
    const handlePrevious = () => { if(exam.allowBackNavigation) { goToQuestion(currentQuestionIndexInSection - 1); } };

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
        handleNext();
    };

    const handleClearResponse = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentQuestion.id];
        setAnswers(newAnswers);
        updateStatus(currentQuestion.originalIndex, 'not-answered', true);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const isMarked = questionStatus[currentQuestion.originalIndex] === 'marked' || questionStatus[currentQuestion.originalIndex] === 'answered-and-marked';

    const Palette = () => (
        <>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks /> Question Palette</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-5 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {currentSectionQuestions.map((q, index) => {
                        const status = questionStatus[q.originalIndex];
                        const isCurrent = currentQuestionIndexInSection === index;
                        let colorClass = '';
                        if (isCurrent) { colorClass = 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary ring-offset-background';
                        } else { switch (status) {
                                case 'answered': colorClass = 'bg-green-600 text-white hover:bg-green-700'; break;
                                case 'answered-and-marked': colorClass = 'bg-sky-600 text-white hover:bg-sky-700'; break;
                                case 'marked': colorClass = 'bg-purple-600 text-white hover:bg-purple-700'; break;
                                case 'not-answered': colorClass = 'bg-orange-500 text-white hover:bg-orange-600'; break;
                                default: colorClass = 'bg-secondary hover:bg-secondary/80'; break;
                        } }
                        return (<Button key={q.id} variant="outline" onClick={() => goToQuestion(index)} className={cn("h-8 w-8 p-0 border-transparent", colorClass)} size="icon">{exam.showQuestionNumbers ? index + 1 : ''}</Button>);
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
    }

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
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden p-2 pt-0 md:p-6 md:pt-2">
                 <Tabs value={activeSection} onValueChange={onSectionChange} className="md:hidden mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                         {Object.keys(groupedQuestions).map(section => (
                            <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <div className={cn("hidden md:grid gap-6 h-full mt-4", isPassage ? "md:grid-cols-[1fr_1fr_320px]" : "md:grid-cols-[1fr_320px]")}>
                    {isPassage && (<Card className="flex flex-col"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen /> Reading Passage</CardTitle></CardHeader><CardContent className="flex-1 overflow-auto"><ScrollArea className="h-full pr-4"><p className="text-base leading-relaxed whitespace-pre-wrap">{currentQuestion.passage}</p></ScrollArea></CardContent></Card>)}
                    <div className="flex flex-col gap-6">
                        <Tabs defaultValue={activeSection} onValueChange={onSectionChange}>
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
                                        {exam.showQuestionNumbers && <CardTitle>Question {currentQuestionIndexInSection + 1}</CardTitle>}
                                        <div className="flex items-center gap-x-4 text-sm text-muted-foreground mt-1">
                                            <span>Topic: {currentQuestion.topic}</span><Badge variant="outline">{currentQuestion.questionType}</Badge>
                                            {currentQuestion.questionType === 'Standard' && <span>Marks: {currentQuestion.marks || 1}</span>}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestion.originalIndex, isMarked ? (answers[currentQuestion.id] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestion.id] !== undefined ? 'answered-and-marked' : 'marked'), true )}>
                                        <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-500' : ''}`} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <ScrollArea className="h-full pr-4">
                                    {currentQuestion.questionType === 'Standard' && (<>
                                        <p className="mb-6 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                        <RadioGroup key={currentQuestion.id} value={currentAnswer !== undefined ? String(currentAnswer) : undefined} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value))} className="gap-4">
                                            {currentQuestion.options?.map((option, index) => (<Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary"><RadioGroupItem value={index.toString()} id={`option-${index}`} /><span>{option.text}</span></Label>))}
                                        </RadioGroup>
                                    </>)}
                                    {currentQuestion.questionType === 'Reading Comprehension' && (<div className="space-y-6">
                                        {currentQuestion.subQuestions?.map((subQ, subIndex) => (<div key={subQ.id} className="pt-4 border-t first:border-t-0 first:pt-0">
                                            <div className="flex items-center justify-between mb-4"><p className="font-semibold">Q{subIndex + 1}: {subQ.questionText}</p><Badge variant="secondary">Marks: {subQ.marks || 1}</Badge></div>
                                            <RadioGroup key={subQ.id} value={(currentAnswer as Record<string, number>)?.[subQ.id]?.toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value), subQ.id)} className="gap-4">
                                                {subQ.options.map((option, optionIndex) => (<Label key={optionIndex} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary text-sm"><RadioGroupItem value={optionIndex.toString()} id={`sub-option-${subIndex}-${optionIndex}`} /><span>{option.text}</span></Label>))}
                                            </RadioGroup>
                                        </div>))}
                                    </div>)}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <div className="flex items-center justify-between gap-4 mt-auto">
                            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndexInSection === 0 || !exam.allowBackNavigation}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            <div className="flex items-center justify-end gap-2 ml-auto">
                                <Button variant="secondary" onClick={() => handleNext()}>Skip</Button>
                                <Button variant="outline" onClick={handleClearResponse}>Clear Response</Button>
                                <Button variant="secondary" onClick={handleMarkForReview}>Mark & Next</Button>
                                {currentQuestionIndexInSection === currentSectionQuestions.length - 1 ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="default" disabled={isSubmitting}>Save & Next Section</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>End of Section</AlertDialogTitle><AlertDialogDescription>You have reached the end of this section. Move to the next one?</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Stay</AlertDialogCancel><AlertDialogAction onClick={handleSaveAndNext}>Next Section</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button onClick={handleSaveAndNext}>Save & Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
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
                                {isPassage && (<Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen /> Reading Passage</CardTitle></CardHeader><CardContent><p className="text-base leading-relaxed whitespace-pre-wrap">{currentQuestion.passage}</p></CardContent></Card>)}
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>{exam.showQuestionNumbers && <CardTitle>Question {currentQuestionIndexInSection + 1}</CardTitle>}
                                            <div className="flex items-center gap-x-4 text-sm text-muted-foreground mt-1"><Badge variant="outline">{currentQuestion.questionType}</Badge>{currentQuestion.questionType === 'Standard' && <span>Marks: {currentQuestion.marks || 1}</span>}</div>
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => updateStatus(currentQuestion.originalIndex, isMarked ? (answers[currentQuestion.id] !== undefined ? 'answered' : 'not-answered') : (answers[currentQuestion.id] !== undefined ? 'answered-and-marked' : 'marked'), true )}>
                                            <Bookmark className={`h-4 w-4 ${isMarked ? 'fill-current text-purple-500' : ''}`} />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {currentQuestion.questionType === 'Standard' && (<>
                                        <p className="mb-6 text-base leading-relaxed">{currentQuestion.questionText}</p>
                                        <RadioGroup key={currentQuestion.id} value={currentAnswer !== undefined ? currentAnswer.toString() : undefined} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value))} className="gap-4">
                                            {currentQuestion.options?.map((option, index) => (<Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary"><RadioGroupItem value={index.toString()} id={`option-mob-${index}`} /><span>{option.text}</span></Label>))}
                                        </RadioGroup>
                                    </>)}
                                    {currentQuestion.questionType === 'Reading Comprehension' && (<div className="space-y-6">
                                        {currentQuestion.subQuestions?.map((subQ, subIndex) => (<div key={subQ.id} className="pt-4 border-t first:border-t-0 first:pt-0">
                                            <div className="flex items-center justify-between mb-4"><p className="font-semibold">Q{subIndex + 1}: {subQ.questionText}</p><Badge variant="secondary">Marks: {subQ.marks || 1}</Badge></div>
                                            <RadioGroup key={subQ.id} value={(currentAnswer as Record<string, number>)?.[subQ.id]?.toString()} onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value), subQ.id)} className="gap-4">
                                                {subQ.options.map((option, optionIndex) => (<Label key={optionIndex} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary has-[input:checked]:bg-secondary has-[input:checked]:border-primary text-sm"><RadioGroupItem value={optionIndex.toString()} id={`sub-option-mob-${subIndex}-${optionIndex}`} /><span>{option.text}</span></Label>))}
                                            </RadioGroup>
                                        </div>))}
                                    </div>)}
                                </CardContent>
                            </Card>
                        )}
                        {mobileTab === 'palette' && (<div className="flex flex-col gap-6"><Palette /></div>)}
                    </div>

                    <div className='flex flex-col gap-2 pt-2 mt-auto'>
                         <div className="flex items-center justify-between gap-2">
                             <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentQuestionIndexInSection === 0 || !exam.allowBackNavigation}><ChevronLeft className="mr-1 h-4 w-4" /> Prev</Button>
                             <div className="flex items-center justify-end gap-1"><Button variant="secondary" size="sm" onClick={handleClearResponse}>Clear</Button><Button variant="secondary" size="sm" onClick={handleMarkForReview}>Mark</Button></div>
                             {currentQuestionIndexInSection === currentSectionQuestions.length - 1 ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="default" size="sm" disabled={isSubmitting}>Submit</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This is the last question. Once you submit, you can't change answers.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (<Button onClick={handleSaveAndNext} size="sm">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>)}
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

    