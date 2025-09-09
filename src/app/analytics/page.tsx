
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/app/auth-provider';
import { getResultsForUser, type ExamResult } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, BookMarked, CheckCircle, Clock, Percent, XCircle } from 'lucide-react';
import PerformanceTrendChart from '@/components/app/performance-trend-chart';
import SubjectPerformanceTable from '@/components/app/subject-performance-table';
import PerformanceAnalysisAI from '@/components/app/performance-analysis-ai';
import Header from '@/components/app/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
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

  const summaryStats = useMemo(() => {
    if (!results || results.length === 0) {
      return {
        totalExams: 0,
        avgScore: 0,
        avgAccuracy: 0,
        totalTime: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
      };
    }
    const totalExams = results.length;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const totalAccuracy = results.reduce((acc, r) => acc + r.accuracy, 0);
    const totalTime = results.reduce((acc, r) => acc + r.timeTaken, 0);
    const totalCorrect = results.reduce((acc, r) => acc + r.correctAnswers, 0);
    const totalIncorrect = results.reduce((acc, r) => acc + r.incorrectAnswers, 0);

    return {
      totalExams,
      avgScore: (totalScore / totalExams).toFixed(2),
      avgAccuracy: (totalAccuracy / totalExams).toFixed(2),
      totalTime,
      totalCorrect,
      totalIncorrect,
    };
  }, [results]);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <Skeleton className="h-80 w-full lg:col-span-2" />
                <Skeleton className="h-80 w-full" />
            </div>
             <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }
  
  if (!user || results.length === 0) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-4">
                <Card className="max-w-lg text-center">
                    <CardHeader>
                        <CardTitle>No Analytics Data Available</CardTitle>
                        <CardDescription>
                            {user ? "You haven't completed any exams yet. Take an exam to see your performance analysis." : "Log in to view your performance and track your progress."}
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Button asChild>
                            <Link href={user ? "/mock-tests" : "#"}>{user ? "Take an Exam" : "Log in"}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
                    <BookMarked className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalExams}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.avgScore}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.avgAccuracy}%</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Correct</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalCorrect}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Incorrect</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalIncorrect}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatTime(summaryStats.totalTime)}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Performance Trend</CardTitle>
                    <CardDescription>Your score progression over the last few exams.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 pr-6">
                    <PerformanceTrendChart results={results} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>AI Performance Analysis</CardTitle>
                    <CardDescription>Get personalized suggestions to improve your scores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PerformanceAnalysisAI results={results} />
                </CardContent>
            </Card>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
                <CardDescription>A detailed breakdown of your strengths and weaknesses by subject.</CardDescription>
            </CardHeader>
            <CardContent>
                <SubjectPerformanceTable results={results} />
            </CardContent>
        </Card>

      </main>
    </div>
  );
}
