
import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, BarChart, Award, MinusCircle, CheckCircle } from 'lucide-react';
import { getPublishedExams, getCategoryPerformanceStats, type Exam } from '@/services/firestore';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function CategoryExamList({ categories }: { categories: string[] }) {
  const availableExams = await getPublishedExams(categories);

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
              <span>{exam.totalQuestions || 0} Questions</span>
              <span className="hidden sm:inline">•</span>
               <span>{exam.totalMarks || 0} Marks</span>
              <span className="hidden sm:inline">•</span>
              <span>{exam.durationMin} mins</span>
              <span className='hidden sm:inline'>•</span>
              <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Negative Marking: No</span>
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
    </div>
  );
}


export default async function CategoryExamsPage({ params }: { params: { category: string | string[] } }) {
  const categoryParams = Array.isArray(params.category) ? params.category : [params.category];
  const categories = categoryParams.map(c => decodeURIComponent(c));
  const primaryCategory = categories[0];

  const [availableExams, categoryStats] = await Promise.all([
    getPublishedExams(categories),
    getCategoryPerformanceStats(primaryCategory),
  ]);

  const pageTitle = categories.length > 1 ? `${categories[0]} - ${categories[1]}` : primaryCategory;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{pageTitle} Dashboard</CardTitle>
            <CardDescription>
              A summary of all user performance for the {primaryCategory} category.
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
                <div className="text-2xl font-bold">{categoryStats.averageScore.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Across all users</p>
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
                <CategoryExamList categories={categories} />
              </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
