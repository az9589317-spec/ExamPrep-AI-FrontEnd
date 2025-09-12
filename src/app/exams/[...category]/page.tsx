

'use client'
import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, BarChart, Award, CheckCircle, Download, Loader2, MoreVertical, PlayCircle, XCircle } from 'lucide-react';
import { getPublishedExams, getCategoryPerformanceStats, getQuestionsForExam } from '@/services/firestore';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Exam, Question } from '@/lib/data-structures';
import ExamFilter from '@/components/app/exam-filter';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

function ExamActions({ exam }: { exam: Exam }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    const generateHtmlForPdf = (questions: Question[], withAnswers: boolean) => {
        let content = `
            <html>
            <head>
                <title>${exam.name}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { font-size: 24px; }
                    h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; }
                    .question { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
                    .question p { margin: 0 0 10px; }
                    .options { list-style-type: none; padding-left: 0; }
                    .options li { margin-bottom: 5px; }
                    .answer { font-weight: bold; color: #28a745; }
                    .explanation { background-color: #f8f9fa; border-left: 3px solid #007bff; padding: 10px; margin-top: 10px; }
                    .passage { background-color: #f1f1f1; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                    .print-btn { 
                        position: fixed; top: 20px; right: 20px; 
                        padding: 10px 20px; background-color: #007bff; color: white; 
                        border: none; border-radius: 5px; cursor: pointer;
                        font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    }
                    @media print {
                        body { padding: 10px; }
                        .no-print, .print-btn { display: none; }
                        h1, h2, .question { page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
                <h1>${exam.name}</h1>
                <p>Category: ${exam.category} | Total Questions: ${exam.totalQuestions} | Duration: ${exam.durationMin} minutes</p>
                <hr />
        `;
    
        questions.forEach((question, index) => {
            content += `<div class="question"><h2>Question ${index + 1}</h2>`;
            if (question.questionType === 'Reading Comprehension') {
                content += `<div class="passage"><strong>Passage:</strong><br/>${question.passage || 'N/A'}</div>`;
                question.subQuestions?.forEach((subQ, subIndex) => {
                    content += `<div><strong>Sub-Question ${subIndex + 1}:</strong> ${subQ.questionText}</div>`;
                    content += '<ul class="options">';
                    subQ.options.forEach((opt, i) => {
                        content += `<li>(${String.fromCharCode(97 + i)}) ${opt.text}</li>`;
                    });
                    content += '</ul>';
                    if (withAnswers) {
                        content += `<div class="answer">Correct Answer: (${String.fromCharCode(97 + subQ.correctOptionIndex)}) ${subQ.options[subQ.correctOptionIndex]?.text}</div>`;
                        if(subQ.explanation) content += `<div class="explanation"><strong>Explanation:</strong> ${subQ.explanation}</div>`;
                    }
                    content += `<br/>`;
                });
            } else {
                content += `<p>${question.questionText}</p>`;
                content += '<ul class="options">';
                question.options?.forEach((opt, i) => {
                    content += `<li>(${String.fromCharCode(97 + i)}) ${opt.text}</li>`;
                });
                content += '</ul>';
                if (withAnswers) {
                    content += `<div class="answer">Correct Answer: (${String.fromCharCode(97 + question.correctOptionIndex!)}) ${question.options?.[question.correctOptionIndex!]?.text}</div>`;
                    if(question.explanation) content += `<div class="explanation"><strong>Explanation:</strong> ${question.explanation}</div>`;
                }
            }
            content += `</div>`;
        });
    
        content += `
            </body>
            </html>
        `;
        return content;
    };
    
    const handleDownload = async (withAnswers: boolean, format: 'txt' | 'pdf') => {
        setIsDownloading(true);
        toast({ title: "Preparing Download", description: `Fetching questions for ${exam.name}...` });
        try {
            const questions = await getQuestionsForExam(exam.id);
            if (questions.length === 0) {
                toast({ variant: "destructive", title: "Download Failed", description: "No questions found for this exam." });
                setIsDownloading(false);
                return;
            }

            if (format === 'pdf') {
                const htmlContent = generateHtmlForPdf(questions, withAnswers);
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url);
                toast({ variant: "default", title: "PDF Ready", description: "Please use the 'Print' dialog and select 'Save as PDF' to download your file.", duration: 8000 });

            } else {
                let content = `Exam: ${exam.name}\n`;
                content += `Category: ${exam.category}\n`;
                content += `Total Questions: ${exam.totalQuestions}\n`;
                content += `Duration: ${exam.durationMin} minutes\n`;
                content += `--------------------------------------------------\n\n`;

                questions.forEach((question, index) => {
                    content += `Question ${index + 1}:\n`;
                    if (question.questionType === 'Reading Comprehension') {
                        content += `Passage: ${question.passage || 'N/A'}\n\n`;
                        question.subQuestions?.forEach((subQ, subIndex) => {
                            content += `  Sub-Question ${subIndex + 1}: ${subQ.questionText}\n`;
                            subQ.options.forEach((opt, i) => {
                                content += `    (${String.fromCharCode(97 + i)}) ${opt.text}\n`;
                            });
                            if (withAnswers) {
                                content += `  Correct Answer: (${String.fromCharCode(97 + subQ.correctOptionIndex)}) ${subQ.options[subQ.correctOptionIndex]?.text}\n`;
                                if(subQ.explanation) content += `  Explanation: ${subQ.explanation}\n`;
                            }
                            content += `\n`;
                        });
                    } else {
                        content += `${question.questionText}\n\n`;
                        question.options?.forEach((opt, i) => {
                            content += `  (${String.fromCharCode(97 + i)}) ${opt.text}\n`;
                        });
                        if (withAnswers) {
                            content += `\nCorrect Answer: (${String.fromCharCode(97 + question.correctOptionIndex!)}) ${question.options?.[question.correctOptionIndex!]?.text}\n`;
                            if(question.explanation) content += `Explanation: ${question.explanation}\n`;
                        }
                    }
                    content += `\n--------------------------------------------------\n\n`;
                });

                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                const fileNameSuffix = withAnswers ? '_with_answers' : '';
                link.download = `${exam.name.replace(/ /g, '_')}_Questions${fileNameSuffix}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ variant: "default", title: "Download Started", description: "Your file is being downloaded." });
            }

        } catch (error) {
            console.error("Failed to download questions:", error);
            toast({ variant: "destructive", title: "Download Failed", description: "Could not fetch the questions for this exam." });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDownloading}>
                    {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreVertical className="h-4 w-4" />
                    )}
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/exam/${exam.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Exam
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Download className="mr-2 h-4 w-4" />
                        Download as TXT
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleDownload(false, 'txt')}>Without Answers</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(true, 'txt')}>With Answers</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Download className="mr-2 h-4 w-4" />
                        Download as PDF
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleDownload(false, 'pdf')}>Without Answers</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(true, 'pdf')}>With Answers</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CategoryExamList({ initialExams, categories }: { initialExams: Exam[], categories: string[] }) {
    const isPreviousYearPage = useMemo(() => categories.includes('Previous Year Paper'), [categories]);
    
    const initialCategoryFilter = useMemo(() => {
        // If the URL is for a specific category's previous papers, set that as the initial filter.
        if (isPreviousYearPage && categories.length > 1) {
            const categoryFromUrl = categories.find(c => c !== 'Previous Year Paper');
            return categoryFromUrl || 'all';
        }
        return 'all';
    }, [categories, isPreviousYearPage]);

    if (isPreviousYearPage) {
        return <ExamFilter initialExams={initialExams} initialCategory={initialCategoryFilter} />;
    }

    if (initialExams.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <p>No exams available in this category yet.</p>
                <Button variant="link" asChild>
                    <Link href="/">Back to Categories</Link>
                </Button>
            </div>
        );
    }
    
    const getNegativeMarkingDisplay = (exam: Exam): { display: string; hasNegative: boolean } => {
        if (!exam.sections || exam.sections.length === 0) {
            return { display: "No", hasNegative: false };
        }

        const negativeValues = exam.sections
            .filter(sec => sec.negativeMarking && sec.negativeMarkValue !== undefined)
            .map(sec => sec.negativeMarkValue!);
        
        if (negativeValues.length === 0) {
            return { display: "No", hasNegative: false };
        }

        const valueCounts: Record<number, number> = {};
        let maxCount = 0;
        let mostCommonValue: number | undefined;

        for (const value of negativeValues) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
            if (valueCounts[value] > maxCount) {
                maxCount = valueCounts[value];
                mostCommonValue = value;
            }
        }
        
        const uniqueValues = Object.keys(valueCounts);
        if (uniqueValues.length === 1) {
             return { display: `-${mostCommonValue}`, hasNegative: true };
        }
        if (uniqueValues.length > 1 && mostCommonValue !== undefined) {
            // Check if there is one clear most common value
            const allCounts = Object.values(valueCounts);
            const sortedCounts = [...allCounts].sort((a, b) => b - a);
            if (sortedCounts.length > 1 && sortedCounts[0] === sortedCounts[1]) {
                 return { display: "Varies", hasNegative: true };
            }
            return { display: `-${mostCommonValue}`, hasNegative: true };
        }
        
        return { display: "Yes", hasNegative: true }; // Fallback
    };


    return (
        <div className="divide-y divide-border rounded-md border">
            {initialExams.map((exam) => {
                const { display: negDisplay, hasNegative: hasNegativeMarking } = getNegativeMarkingDisplay(exam);
                return (
                    <div
                        key={exam.id}
                        className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className='flex-1'>
                            <h3 className="font-medium">{exam.name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span>{exam.totalQuestions || 0} Questions</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{exam.totalMarks || 0} Marks</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{exam.durationMin} mins</span>
                                <span className='hidden sm:inline'>•</span>
                                <span className="flex items-center gap-1">
                                    {hasNegativeMarking ? (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                    ) : (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                    <span>Negative Marking: {negDisplay}</span>
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-row items-center gap-2">
                            <Link href={`/exam/${exam.id}`} className="w-full sm:w-auto">
                                <Button variant="outline" size="sm" className="w-full">
                                    Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <ExamActions exam={exam} />
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

export default function CategoryExamsPage() {
    const params = useParams();
    const [initialExams, setInitialExams] = useState<Exam[]>([]);
    const [categoryStats, setCategoryStats] = useState({ averageScore: 0, highestScore: 0, highestScoreExamName: 'N/A' });
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [pageTitle, setPageTitle] = useState('');

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const decodedCategories = Array.isArray(params.category) ? params.category.map(c => decodeURIComponent(c)) : [decodeURIComponent(params.category as string)];
            setCategories(decodedCategories);

            const primaryCat = decodedCategories[0] || '';
            const isPYP = primaryCat === 'Previous Year Paper';
            const pageStatsCategory = isPYP ? (decodedCategories[1] || 'Previous Year Paper') : primaryCat;

            setPageTitle(decodedCategories.join(' - '));

            try {
                // If it's a Previous Year Paper page (e.g., /exams/Previous Year Paper/Banking),
                // we need to pass all categories to getPublishedExams to construct the correct query.
                const categoriesForFetching = decodedCategories;

                const [exams, stats] = await Promise.all([
                    getPublishedExams(categoriesForFetching),
                    getCategoryPerformanceStats(pageStatsCategory),
                ]);
                
                setInitialExams(exams);
                setCategoryStats(stats);
            } catch (error) {
                console.error("Failed to fetch exam data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (params.category) {
            fetchData();
        }
    }, [params.category]);


    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-10 w-1/2" />
                            <Skeleton className="h-4 w-1/3 mt-2" />
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-28" />
                            <Skeleton className="h-28" />
                            <Skeleton className="h-28" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-8 w-1/4" />
                             <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-64" />
                                        </div>
                                        <Skeleton className="h-9 w-28" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">{pageTitle} Dashboard</CardTitle>
                        <CardDescription>
                            A summary of all user performance for the {categories[0]} category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Exams Available</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{initialExams.length}</div>
                                <p className="text-xs text-muted-foreground">Published exams in this section</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{categoryStats.averageScore.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Across all users in {categories[0]}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{categoryStats.highestScore.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground truncate">in {categoryStats.highestScoreExamName}</p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Available Mock Tests</CardTitle>
                        <CardDescription>
                            Choose from the mock tests below to start your practice.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CategoryExamList initialExams={initialExams} categories={categories} />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
