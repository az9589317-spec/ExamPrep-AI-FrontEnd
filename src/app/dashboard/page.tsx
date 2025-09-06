
import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Award, BarChart, BookMarked, ChevronRight } from 'lucide-react';
import { exams as allExams } from '@/lib/mock-data';

export default function DashboardPage() {
  const publishedExams = allExams.filter(exam => exam.status === 'published');
  
  const examsByCategory = publishedExams.reduce((acc, exam) => {
    const { category } = exam;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exam);
    return acc;
  }, {} as Record<string, typeof publishedExams>);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">+5 since last month</p>
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
        </div>
        
        <div className="space-y-8">
            {Object.entries(examsByCategory).map(([category, exams]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="font-headline">{category}</CardTitle>
                        <CardDescription>
                            Select an exam from the {category} category to start your practice.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-border rounded-md border">
                            {exams.map((exam) => (
                                <div key={exam.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-medium">{exam.name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
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
            ))}
        </div>
      </main>
    </div>
  );
}
