
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddQuestionForm } from "@/components/app/add-question-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ExamQuestionsPage() {
  const params = useParams();
  const examId = params.examId as string;

  // In a real app, you would fetch the exam details and questions based on examId
  const exam = {
    id: examId,
    name: "SBI PO Prelims Mock 2", // This would be fetched
  };

  const questions = [
    { id: 'q1', questionText: 'What is the speed of a train that covers 240 km in 3 hours?', subject: 'Quantitative Aptitude', topic: 'Time, Speed & Distance', difficulty: 'easy' as const, options: [{text:'80 km/hr'}, {text: '90 km/hr'}, {text: '60 km/hr'}], correctOptionIndex: 0, explanation: 'Speed = Distance / Time = 240 / 3 = 80 km/hr' },
    { id: 'q2', questionText: 'Which of the following is not a vowel in the English alphabet?', subject: 'English Language', topic: 'Alphabet', difficulty: 'easy' as const, options: [{text: 'A'}, {text: 'E'}, {text: 'Z'}, {text: 'I'}], correctOptionIndex: 2 },
    { id: 'q3', questionText: 'A man buys an article for Rs. 27.50 and sells it for Rs. 28.60. Find his gain percent.', subject: 'Quantitative Aptitude', topic: 'Profit and Loss', difficulty: 'medium' as const, options: [{text: '4%'}, {text: '5%'}, {text: '3%'}, {text: '6%'}], correctOptionIndex: 0 },
    { id: 'q4', questionText: 'Select the synonym of "ephemeral".', subject: 'English Language', topic: 'Vocabulary', difficulty: 'hard' as const, options: [{text: 'Permanent'}, {text: 'Transient'}, {text: 'Eternal'}], correctOptionIndex: 1 },
  ];

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
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
            <div className="ml-auto flex items-center gap-2">
                <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Question
                    </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                    <DialogTitle>Add a New Question</DialogTitle>
                        <DialogDescription>Fill out the form below to add a question to this exam.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[70vh] pr-6">
                      <AddQuestionForm examId={exam.id} />
                    </ScrollArea>
                </DialogContent>
                </Dialog>
            </div>
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
                    <p className="line-clamp-2">{question.questionText}</p>
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
                    <Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Edit Question</DialogTitle>
                          <DialogDescription>Make changes to the question below.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[70vh] pr-6">
                            <AddQuestionForm examId={exam.id} initialData={question} />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
