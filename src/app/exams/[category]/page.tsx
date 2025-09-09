

import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, BarChart, Award } from 'lucide-react';
import ProgressChart from '@/components/app/progress-chart';
import { getPublishedExams, type Exam } from '@/services/firestore';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function CategoryExamList({ category }: { category: string }) {
  const availableExams = await getPublishedExams(category);

  if (availableExams.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-10">
            <p>No exams available in this category yet.</p>
            <Button variant="link" asChild>
                <Link href="/">Back to Categories</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-md border">
      {availableExams.map((exam) => (
        <div
          key={exam.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="font-medium">{exam.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{exam.questions} Questions</span>
              <span className="hidden sm:inline">•</span>
              <span>{exam.durationMin} mins</span>
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
    </div>
  );
}


export default async function CategoryExamsPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const availableExams = await getPublishedExams(category);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{category} Dashboard</CardTitle>
            <CardDescription>
              Your performance summary for the {category} category.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exams Available</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableExams.length}</div>
                <p className="text-xs text-muted-foreground">Published exams</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.2%</div>
                <p className="text-xs text-muted-foreground">+1.5% from last exam</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91.5%</div>
                <p className="text-xs text-muted-foreground">in Mock Test 3</p>
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
             <Suspense fallback={
                    <div className="space-y-4">
                        {Array.from({length: 3}).map((_, i) => (
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
                <CategoryExamList category={category} />
              </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
