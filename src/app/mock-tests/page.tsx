
<<<<<<< HEAD

import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, MinusCircle, CheckCircle } from 'lucide-react';
import ExamGenerator from '@/components/app/exam-generator';
import { getPublishedExams, type Exam } from '@/services/firestore';
=======
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getExams } from '@/services/firestore';
import { type Exam } from '@/services/firestore';
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

function MockTestsPage() {
  const [data, setData] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const exams = await getExams();
        setData(exams);
      } catch (err) {
        setError('Failed to fetch mock tests. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleStartTest = (examId: string) => {
    router.push(`/mock-tests/${examId}/take`);
  };

  if (loading) {
    return <MockTestsLoadingSkeleton />;
  }

  if (error) {
    return (
<<<<<<< HEAD
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
=======
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Mock Tests</h1>
        <Button onClick={() => router.push('/admin/exams/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Exam
        </Button>
      </div>
      
      {Array.isArray(data) && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.name}</CardTitle>
                <CardDescription>{exam.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>{exam.totalQuestions || 0} Questions</span>
                  <span>{exam.durationMin} mins</span>
                  <span>{exam.totalMarks || 0} Marks</span>
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
                </div>
                <Button
                  onClick={() => handleStartTest(exam.id)}
                  className="w-full"
                  disabled={exam.status !== 'published'}
                >
                  {exam.status === 'published' ? 'Start Test' : 'Unavailable'}
                </Button>
                {exam.status !== 'published' && (
                    <p className="text-xs text-center text-red-500 mt-2">This exam is not available for attempts right now.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Mock Tests Found</h2>
            <p className="text-muted-foreground mb-4">It looks like there are no mock tests available at the moment.</p>
            <Button onClick={() => router.push('/admin/exams/new')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create the First Exam
            </Button>
        </div>
      )}
    </div>
  );
}

function MockTestsLoadingSkeleton() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function Page() {
  return (
    <Suspense fallback={<MockTestsLoadingSkeleton />}>
      <MockTestsPage />
    </Suspense>
  );
}
