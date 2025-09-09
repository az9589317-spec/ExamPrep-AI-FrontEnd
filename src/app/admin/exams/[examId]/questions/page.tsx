
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, MoreHorizontal, PlusCircle, BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddQuestionForm } from "@/components/app/add-question-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getExam, getQuestionsForExam, type Exam, type Question } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


export default function ExamQuestionsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        if (!examId) return;
        try {
            const [examData, questionsData] = await Promise.all([
                getExam(examId),
                getQuestionsForExam(examId)
            ]);
            setExam(JSON.parse(JSON.stringify(examData)));
            setQuestions(JSON.parse(JSON.stringify(questionsData)));
        } catch (error) {
            console.error("Failed to fetch exam data:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load exam data." });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [examId, toast]);

  const questionsToRender = useMemo(() => {
    // Filter out child questions so they don't appear as main rows
    return questions.filter(q => !q.parentQuestionId);
  }, [questions]);


  if (isLoading) {
      return (
          <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center justify-between">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-8 w-8" />
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
      )
  }

  if (!exam) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>Exam Not Found</CardTitle>
                    <CardDescription>The exam you are looking for does not exist.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/admin">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href={`/admin/category/${encodeURIComponent(exam.category)}`}>
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
                    <ScrollArea className="h-[80vh] pr-6">
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
                <TableHead className="w-[60%]">Content</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden md:table-cell">Difficulty</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsToRender.map((question) => {
                  const isPassage = question.type === 'RC_PASSAGE';
                  // Find child questions if it's a passage
                  const childQuestions = isPassage ? questions.filter(q => q.parentQuestionId === question.id) : [];

                  const initialDataForForm = {
                    id: question.id,
                    type: question.type,
                    subject: question.subject,
                    topic: question.topic,
                    difficulty: question.difficulty,
                    standard: isPassage ? undefined : {
                      questionText: question.questionText,
                      marks: question.marks,
                      options: question.options,
                      correctOptionIndex: question.correctOptionIndex,
                      explanation: question.explanation
                    },
                    rc: isPassage ? {
                      passage: question.passage,
                      childQuestions: childQuestions,
                    } : undefined
                  };

                return (
                    <TableRow key={question.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                           {isPassage ? <BookOpen className="mt-1 h-4 w-4 text-muted-foreground" /> : <FileText className="mt-1 h-4 w-4 text-muted-foreground" />}
                            <p className="line-clamp-2">{isPassage ? question.passage : question.questionText}</p>
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{isPassage ? `RC (${childQuestions.length} Qs)` : 'Standard'}</Badge>
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
                            <ScrollArea className="h-[80vh] pr-6">
                                <AddQuestionForm examId={exam.id} initialData={JSON.parse(JSON.stringify(initialDataForForm))} />
                            </ScrollArea>
                        </DialogContent>
                        </Dialog>
                    </TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
            {questionsToRender.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No questions found for this exam.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
