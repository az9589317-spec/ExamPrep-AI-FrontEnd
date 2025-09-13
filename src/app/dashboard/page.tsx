
'use client';

import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Award, BarChart, BookMarked, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/app/auth-provider';
import { useEffect, useState } from 'react';
import { getResultsForUser, type ExamResult } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getResultsForUser(user.uid)
                .then(data => setResults(data as any[]))
                .finally(() => setIsLoading(false));
        } else if (!isAuthLoading) {
            setIsLoading(false);
        }
    }, [user, isAuthLoading]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-1/3 mt-2" />
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-3">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <Header />
                <main className="flex flex-1 items-center justify-center p-4">
                     <Card className="max-w-lg text-center">
                        <CardHeader>
                            <CardTitle>Welcome to Your Dashboard</CardTitle>
                            <CardDescription>Log in to view your performance and track your progress.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">You are not logged in.</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const examsTaken = results.length;
    const validResultsForAvg = results.filter(r => r.maxScore && r.maxScore > 0);
    const averageScorePercentage = validResultsForAvg.length > 0 ? (validResultsForAvg.reduce((acc, r) => acc + (r.score / r.maxScore * 100), 0) / validResultsForAvg.length).toFixed(2) : '0';
    const highestScore = examsTaken > 0 ? Math.max(...results.map(r => r.score)).toFixed(2) : '0';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <Card>
          <CardHeader>
              <CardTitle className="font-headline">Your Performance Summary</CardTitle>
              <CardDescription>A summary of your progress across all exams you've taken.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{examsTaken}</div>
                  <p className="text-xs text-muted-foreground">Total exams you have completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScorePercentage}%</div>
                   <p className="text-xs text-muted-foreground">Your average percentage across all exams</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{highestScore}</div>
                  <p className="text-xs text-muted-foreground">Your best absolute score so far</p>
                </CardContent>
              </Card>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Your Exam History</CardTitle>
                <CardDescription>
                    Review your past attempts and re-take exams to improve your score.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-border rounded-md border">
                    {results.length > 0 ? results.map((result) => (
                        <div key={result.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                <h3 className="font-medium">{result.examName}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={result.score >= (result.maxScore / 2) ? "default" : "destructive"}>{result.score >= (result.maxScore / 2) ? 'Passed' : 'Failed'}</Badge>
                                        <Separator orientation='vertical' className='h-4'/>
                                    </div>
                                    <span>Score: <span className="font-bold">{result.score} / {result.maxScore}</span></span>
                                    <span>Accuracy: <span className="font-bold">{result.accuracy}%</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 sm:mt-0">
                                <Link href={`/exam/${result.examId}/results?resultId=${result.id}`} className='w-full sm:w-auto'>
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Results <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href={`/exam/${result.examId}`} className='w-full sm:w-auto'>
                                    <Button variant="secondary" size="sm" className="w-full">
                                        Re-take Exam <RefreshCw className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 text-center text-muted-foreground">
                            <BookMarked className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Exams Taken Yet</h3>
                            <p className="mt-2 text-sm">Once you complete an exam, your results will appear here.</p>
                             <Button asChild className='mt-4'>
                                <Link href="/mock-tests">Browse Available Exams</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
