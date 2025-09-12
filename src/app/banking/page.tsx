
import Link from 'next/link';
import React from 'react';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Landmark, BookCopy } from 'lucide-react';
import { getExamCategories } from '@/services/firestore';

const bankingSubCategories = [
    {
        name: 'IBPS',
        description: 'Exams conducted by the Institute of Banking Personnel Selection.',
    },
    {
        name: 'SBI',
        description: 'Recruitment exams for the State Bank of India.',
    },
    {
        name: 'RBI',
        description: 'Opportunities with the Reserve Bank of India.',
    },
];

async function BankingCategoryPage() {
    const { examCountByCategory } = await getExamCategories();
    const previousYearPaperCount = examCountByCategory['Banking']?.['Previous Year Paper'] || 0;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-headline tracking-tight">Banking Exams</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Select a sub-category to view available mock tests.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {bankingSubCategories.map((category) => (
                        <Link href={`/exams/Banking/${encodeURIComponent(category.name)}`} key={category.name}>
                            <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Landmark className="h-8 w-8 text-primary" />
                                        <CardTitle className="font-headline">{category.name}</CardTitle>
                                    </div>
                                    <CardDescription className="pt-2">
                                        {category.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                            {examCountByCategory[category.name] || 0} Exams
                                        </div>
                                        <div className="font-medium text-primary flex items-center">
                                            View Exams <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                     <Link href={`/exams/Previous Year Paper`}>
                        <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <BookCopy className="h-8 w-8 text-primary" />
                                    <CardTitle className="font-headline">Previous Year Papers</CardTitle>
                                </div>
                                <CardDescription className="pt-2">
                                    Practice with actual questions from past Banking exams.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                        {previousYearPaperCount} Exams
                                    </div>
                                    <div className="font-medium text-primary flex items-center">
                                        View Papers <ArrowRight className="ml-2 h-4 w-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default BankingCategoryPage;
