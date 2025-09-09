'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getExams } from '@/services/firestore';
import { type Exam } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

function MockTestsPage() {
  const [data, setData] = useState<Exam[] | null>(null);
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
      
      {data && data.length > 0 ? (
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
