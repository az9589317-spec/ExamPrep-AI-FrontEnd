
'use client';

import Link from 'next/link';
import React from 'react';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Briefcase } from 'lucide-react';
import ExamGenerator from '@/components/app/exam-generator';
import { getExamCategories } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { allCategories } from '@/lib/categories.tsx';
import { useAuth } from '@/components/app/auth-provider';

function CategoryList() {
    const [examCountByCategory, setExamCountByCategory] = React.useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        getExamCategories().then(({ examCountByCategory }) => {
            setExamCountByCategory(examCountByCategory);
            setIsLoading(false);
        });
    }, []);


    const getCount = (categoryName: string) => {
        if (isLoading) return 0;
        const countData = examCountByCategory[categoryName];
        if (typeof countData === 'object' && countData !== null) {
            return countData._total || 0;
        }
        return countData || 0;
    };

    if (isLoading) {
        return (
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
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allCategories.map((category) => (
                <Link href={category.href} key={category.name}>
                    <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                {category.icon || <Briefcase className="h-8 w-8 text-gray-500" />}
                                <CardTitle className="font-headline">{category.name}</CardTitle>
                            </div>
                            <CardDescription className="pt-2">
                                {category.description || `Practice exams for the ${category.name} category.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between text-sm">
                                <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {getCount(category.name)} Exams
                                </div>
                                <div className="font-medium text-primary flex items-center">
                                    View Exams <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}


export default function Home() {
    const { user } = useAuth();
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold font-headline tracking-tight">
                            {user ? `Welcome, ${user.displayName?.split(' ')[0] || 'User'}!` : 'Welcome to ExamPrep AI'}
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">Select a category to start your journey to success.</p>
                    </div>
                    <div className="hidden sm:block">
                        <ExamGenerator />
                    </div>
                </div>
                <CategoryList />
            </main>
        </div>
    );
}
