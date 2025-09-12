
'use client'

import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, MinusCircle, CheckCircle, Search } from 'lucide-react';
import ExamGenerator from '@/components/app/exam-generator';
import { getPublishedExams, type Exam } from '@/services/firestore';
import React, { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import ExamFilter from '@/components/app/exam-filter';


function AllExamsData({ searchQuery }: { searchQuery: string | undefined }) {
    const [initialExams, setInitialExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getPublishedExams()
            .then(exams => {
                setInitialExams(exams);
            })
            .catch(error => {
                console.error("Failed to fetch exams:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
             <div className="space-y-4">
                {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-28" />
                    </div>
                ))}
            </div>
        );
    }
    
    // The search query from the header will be handled by the ExamFilter component now
    return <ExamFilter initialExams={initialExams} initialCategory='all' searchQuery={searchQuery} />;
}


export default function MockTestsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || undefined;
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">All Mock Tests</CardTitle>
                    <CardDescription>
                        {searchQuery 
                            ? `Showing results for "${searchQuery}"`
                            : "Browse all tests or use the filters to narrow your search."
                        }
                    </CardDescription>
                </div>
                <ExamGenerator />
            </CardHeader>
            <CardContent>
                <Suspense fallback={
                    <div className="space-y-4">
                        {Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-9 w-28" />
                            </div>
                        ))}
                    </div>
                }>
                    <AllExamsData searchQuery={searchQuery} />
                </Suspense>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
