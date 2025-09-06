import Link from 'next/link';
import Header from '@/components/app/header';
import ExamGenerator from '@/components/app/exam-generator';
import ProgressChart from '@/components/app/progress-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Award, BarChart, BookMarked, ChevronRight } from 'lucide-react';

export default function Home() {

  const availableExams = [
    { id: 'sbi-po-prelims-mock-2', name: 'SBI PO Prelims Mock 2', category: 'Bank PO', questions: 100, duration: '60 mins' },
    { id: 'ibps-po-mains-mock-1', name: 'IBPS PO Mains Mock 1', category: 'Bank PO', questions: 155, duration: '180 mins' },
    { id: 'daily-quiz-quant-21-jul', name: 'Daily Quiz - Quant (21 July)', category: 'Daily Quiz', questions: 10, duration: '15 mins' },
    { id: 'rbi-assistant-prelims-pyq-2022', name: 'RBI Assistant Prelims 2022', category: 'Previous Year Paper', questions: 100, duration: '60 mins' },
  ];

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
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle className="font-headline">Available Exams</CardTitle>
                <CardDescription>
                  Choose from mock tests, daily quizzes, and previous year papers.
                </CardDescription>
              </div>
              <div className="ml-auto">
                <ExamGenerator />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Questions</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div className="font-medium">{exam.name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{exam.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{exam.questions}</TableCell>
                      <TableCell className="hidden sm:table-cell">{exam.duration}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/exam/${exam.id}`}>
                          <Button variant="outline" size="sm">
                            Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Performance by Subject</CardTitle>
              <CardDescription>Your accuracy in recent tests.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
