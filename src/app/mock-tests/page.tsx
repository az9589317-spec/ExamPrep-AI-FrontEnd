import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { exams as allExams } from '@/lib/mock-data';
import ExamGenerator from '@/components/app/exam-generator';

export default function MockTestsPage() {
  const availableExams = allExams.filter(exam => exam.status === 'published');

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
              <div className="divide-y divide-border rounded-md border">
                {availableExams.map((exam) => (
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
              </div>
            </CardContent>
          </Card>
      </main>
    </div>
  );
}
