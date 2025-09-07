
import Link from 'next/link';
import React from 'react';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookCopy, Briefcase, TramFront, Users, Landmark, Atom, Stethoscope, LineChart, Gavel } from 'lucide-react';
import ExamGenerator from '@/components/app/exam-generator';
import { getExamCategories } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';

async function CategoryList() {
    const { categories } = await getExamCategories();

    const categoryIcons: Record<string, React.ReactNode> = {
        'Banking': <Briefcase className="h-8 w-8 text-primary" />,
        'SSC': <Users className="h-8 w-8 text-primary" />,
        'Railway': <TramFront className="h-8 w-8 text-primary" />,
        'UPSC': <Landmark className="h-8 w-8 text-primary" />,
        'JEE': <Atom className="h-8 w-8 text-primary" />,
        'NEET': <Stethoscope className="h-8 w-8 text-primary" />,
        'CAT': <LineChart className="h-8 w-8 text-primary" />,
        'CLAT': <Gavel className="h-8 w-8 text-primary" />,
        'Daily Quiz': <BookCopy className="h-8 w-8 text-primary" />,
        'Previous Year Paper': <BookCopy className="h-8 w-8 text-primary" />,
    };

    const categoryDescriptions: Record<string, string> = {
        'Banking': 'Prepare for exams like SBI PO, IBPS PO, and RBI Assistant.',
        'SSC': 'Ace your SSC CGL, CHSL, and other competitive exams.',
        'Railway': 'Get on the right track for NTPC, Group D, and other railway jobs.',
        'UPSC': 'Crack the Civil Services Exam for various administrative jobs.',
        'JEE': 'Prepare for Main & Advanced exams for engineering admissions.',
        'NEET': 'Your gateway to top medical and dental colleges in India.',
        'CAT': 'Secure your admission into premier MBA programs.',
        'CLAT': 'Pursue a degree in law from National Law Universities.',
        'Daily Quiz': 'Test your knowledge with quick daily quizzes on various subjects.',
        'Previous Year Paper': 'Practice with actual questions from past examinations.',
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
                <Link href={`/exams/${encodeURIComponent(category)}`} key={category}>
                    <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                {categoryIcons[category] || <Briefcase className="h-8 w-8 text-gray-500" />}
                                <CardTitle className="font-headline">{category}</CardTitle>
                            </div>
                            <CardDescription className="pt-2">
                                {categoryDescriptions[category] || `Practice exams for the ${category} category.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-end text-sm font-medium text-primary">
                                View Exams <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}


export default function Home() {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold font-headline tracking-tight">Welcome to ExamPrep AI</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Select a category to start your journey to success.</p>
                    </div>
                    <div className="hidden sm:block">
                        <ExamGenerator />
                    </div>
                </div>

                <React.Suspense fallback={
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <Card key={i} className="h-48">
                               <CardHeader>
                                   <Skeleton className="h-8 w-3/4" />
                                   <Skeleton className="h-4 w-full mt-2" />
                                   <Skeleton className="h-4 w-2/3 mt-1" />
                               </CardHeader>
                               <CardContent>
                                    <Skeleton className="h-6 w-1/2 ml-auto" />
                               </CardContent>
                           </Card>
                        ))}
                    </div>
                }>
                    <CategoryList />
                </React.Suspense>

            </main>
        </div>
    );
}
