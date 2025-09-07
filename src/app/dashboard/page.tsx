
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Award, BarChart, BookMarked, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProgressChart from '@/components/app/progress-chart';
import ExamGenerator from '@/components/app/exam-generator';
import { getPublishedExams, type Exam } from '@/services/firestore';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function ExamList() {
  const publishedExams = await getPublishedExams();
  return (
    <div className="divide-y divide-border rounded-md border">
        {publishedExams.map((exam) => (
            <div key={exam.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="font-medium">{exam.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span>{exam.category}</span>
                        <span className='hidden sm:inline'>•</span>
                        <span>{exam.questions} Questions</span>
                        <span className='hidden sm:inline'>•</span>
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
        {publishedExams.length === 0 && (
            <p className="p-4 text-center text-muted-foreground">No mock tests available yet.</p>
        )}
    </div>
  );
}

export default async function DashboardPage() {
  const publishedExams = await getPublishedExams();
  const publishedExamsCount = publishedExams.length;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <Card>
          <CardHeader>
              <CardTitle className="font-headline">Overall Performance</CardTitle>
              <CardDescription>A summary of your progress across all exams.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exams Available</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{publishedExamsCount}</div>
                  <p className="text-xs text-muted-foreground">Total published exams</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">72.5%</div>
                  <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Percentile</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.2%</div>
                  <p className="text-xs text-muted-foreground">in SBI PO Prelims Mock 5</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 new topics this week</p>
                </CardContent>
              </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="font-headline">Subject-wise Accuracy</CardTitle>
              <CardDescription>Your performance breakdown by subject across all exams.</CardDescription>
          </CardHeader>
          <CardContent>
              <ProgressChart />
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">All Mock Tests</CardTitle>
                    <CardDescription>
                        A complete list of all available mock tests across all categories.
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
                    <ExamList />
                </Suspense>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
