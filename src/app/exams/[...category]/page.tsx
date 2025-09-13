

'use client'
import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, BarChart, Award, CheckCircle, Download, Loader2, MoreVertical, PlayCircle, XCircle, ShieldQuestion, BookOpen } from 'lucide-react';
import { getPublishedExams, getCategoryPerformanceStats } from '@/services/firestore';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Exam, Question } from '@/lib/data-structures';
import ExamFilter from '@/components/app/exam-filter';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/app/auth-provider';
import { logExamDownload } from '@/services/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function CategoryExamList({ initialExams, categories }: { initialExams: Exam[], categories: string[] }) {
    const isPreviousYearPage = useMemo(() => categories.includes('Previous Year Paper'), [categories]);

    if (isPreviousYearPage) {
        const initialCategoryFilter = categories.length > 1 ? categories.find(c => c !== 'Previous Year Paper') || 'all' : 'all';
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
    
    // For regular category pages, we pass the initial exams directly to the filter component
    // The filter component will handle the tabs for "Full Mock", "Sectional Mock" etc.
    const initialCategory = categories[0] || 'all';
    const subCategory = categories[1] || 'all';
    return <ExamFilter initialExams={initialExams} initialCategory={initialCategory} initialSubCategory={subCategory} />;
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
                // Fetch all exams and then filter on the client
                const [exams, stats] = await Promise.all([
                    getPublishedExams(), // Fetch all published exams
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
                                <div className="text-2xl font-bold">{initialExams.filter(e => e.category === categories[0] || (e.subCategory && e.subCategory.includes(categories[0]))).length}</div>
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
