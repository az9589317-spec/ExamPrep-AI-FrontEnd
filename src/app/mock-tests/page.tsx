

import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, MinusCircle, CheckCircle } from 'lucide-react';
import ExamGenerator from '@/components/app/exam-generator';
import { getPublishedExams, type Exam } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

async function ExamList() {
    const availableExams = await getPublishedExams();

    return (
        <div className="divide-y divide-border rounded-md border">
            {availableExams.map((exam: Exam) => (
                <div key={exam.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-medium">{exam.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span>{exam.category}</span>
                            <span className='hidden sm:inline'>•</span>
                            <span>{exam.totalQuestions || 0} Questions</span>
                            <span className='hidden sm:inline'>•</span>
                            <span>{exam.totalMarks || 0} Marks</span>
                            <span className='hidden sm:inline'>•</span>
                            <span>{exam.durationMin} mins</span>
                            <span className='hidden sm:inline'>•</span>
                            <span className="flex items-center gap-1">
                                {exam.negativeMarkPerWrong ? <MinusCircle className="h-3 w-3 text-red-500"/> : <CheckCircle className="h-3 w-3 text-green-500" />}
                                <span>Negative Marking: {exam.negativeMarkPerWrong ? `${exam.negativeMarkPerWrong} marks` : 'No'}</span>
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                        <Link href={`/exam/${exam.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        </Link>
                    </div>
                </div>
            ))}
             {availableExams.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">No mock tests available yet.</p>
             )}
        </div>
    );
}

export default function MockTestsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="grid gap-2">
                <CardTitle className="font-headline">Available Mock Tests</CardTitle>
                <CardDescription>
                  Choose from mock tests, daily quizzes, and previous year papers.
                </CardDescription>
              </div>
              <ExamGenerator />
            </CardHeader>
            <CardContent>
                <React.Suspense fallback={
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
                    <ExamList />
                </React.Suspense>
            </CardContent>
          </Card>
      </main>
    </div>
  );
}
