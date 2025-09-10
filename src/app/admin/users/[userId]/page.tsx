
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart, BookMarked, CheckCircle, ChevronRight, Clock, Percent, RefreshCw, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getUser, getResultsForUser, type UserProfile, type ExamResult } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const { toast } = useToast();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                const [userData, resultsData] = await Promise.all([
                    getUser(userId),
                    getResultsForUser(userId)
                ]);

                if (!userData) {
                    toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                    router.push('/admin/users');
                    return;
                }

                setUser(userData);
                setResults(resultsData as any[]);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [userId, router, toast]);
    
    const summaryStats = useMemo(() => {
        if (!results || results.length === 0) {
            return {
                totalExams: 0,
                avgScore: 0,
                avgAccuracy: 0,
                totalCorrect: 0,
                totalIncorrect: 0,
            };
        }
        const totalExams = results.length;
        const totalScore = results.reduce((acc, r) => acc + (r.score / r.maxScore * 100), 0);
        const totalAccuracy = results.reduce((acc, r) => acc + r.accuracy, 0);
        const totalCorrect = results.reduce((acc, r) => acc + r.correctAnswers, 0);
        const totalIncorrect = results.reduce((acc, r) => acc + r.incorrectAnswers, 0);

        return {
            totalExams,
            avgScore: (totalScore / totalExams).toFixed(2),
            avgAccuracy: (totalAccuracy / totalExams).toFixed(2),
            totalCorrect,
            totalIncorrect,
        };
    }, [results]);

    if (isLoading) {
        return (
            <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-1 items-center justify-center text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>User not found</CardTitle>
                        <CardDescription>The user you are looking for does not exist.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/admin/users">Back to Users</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL} alt={user.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
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
                            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.avgScore}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Accuracy</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.avgAccuracy}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalCorrect}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Incorrect Answers</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.totalIncorrect}</div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Exam History</CardTitle>
                    <CardDescription>A list of all exams attempted by {user.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Accuracy</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length > 0 ? results.map((result) => (
                                <TableRow key={result.id}>
                                    <TableCell className="font-medium">{result.examName}</TableCell>
                                    <TableCell>{result.score}/{result.maxScore}</TableCell>
                                    <TableCell>{result.accuracy}%</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date((result.submittedAt as any).seconds * 1000).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/exam/${result.examId}/results?resultId=${result.id}`}>View Details</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        This user has not attempted any exams yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
