import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddQuestionForm } from "@/components/app/add-question-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";


export default function ExamQuestionsPage({ params }: { params: { examId: string } }) {
  // In a real app, you would fetch the exam details and questions based on params.examId
  const exam = {
    id: params.examId,
    name: "SBI PO Prelims Mock 2", // This would be fetched
  };

  const questions = [
    { id: 'q1', text: 'What is the speed of a train that covers 240 km in 3 hours?', subject: 'Quantitative Aptitude', topic: 'Time, Speed & Distance', difficulty: 'easy' },
    { id: 'q2', text: 'Which of the following is not a vowel in the English alphabet?', subject: 'English Language', topic: 'Alphabet', difficulty: 'easy' },
    { id: 'q3', text: 'A man buys an article for Rs. 27.50 and sells it for Rs. 28.60. Find his gain percent.', subject: 'Quantitative Aptitude', topic: 'Profit and Loss', difficulty: 'medium' },
    { id: 'q4', text: 'Select the synonym of "ephemeral".', subject: 'English Language', topic: 'Vocabulary', difficulty: 'hard' },
  ];

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Questions</h1>
          <p className="text-muted-foreground">For exam: <span className="font-semibold">{exam.name}</span></p>
        </div>
      </div>
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add a New Question</CardTitle>
            <CardDescription>Fill out the form below to add a question to this exam.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddQuestionForm examId={exam.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Questions</CardTitle>
            <CardDescription>A list of all questions currently in this exam.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Question</TableHead>
                  <TableHead className="hidden md:table-cell">Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Difficulty</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      <p className="line-clamp-2">{question.text}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{question.subject}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={
                        question.difficulty === 'hard' ? 'destructive' :
                        question.difficulty === 'medium' ? 'secondary' : 'outline'
                      }>
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
