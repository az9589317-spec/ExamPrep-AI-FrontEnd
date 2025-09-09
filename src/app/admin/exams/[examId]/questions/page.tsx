
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddQuestionForm } from "@/components/app/add-question-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getExam, getQuestionsForExam, type Exam, type Question } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteQuestionAction } from "@/app/admin/actions";


export default function ExamQuestionsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchExamAndQuestions = async () => {
      if (!examId) return;
      setIsLoading(true);
      try {
          const [examData, questionsData] = await Promise.all([
              getExam(examId),
              getQuestionsForExam(examId)
          ]);
          setExam(examData);
          setQuestions(JSON.parse(JSON.stringify(questionsData)));
      } catch (error) {
          console.error("Failed to fetch exam data:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load exam data." });
      } finally {
          setIsLoading(false);
      }
  }

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId, toast]);

  const openAddDialog = () => {
    setSelectedQuestion(undefined);
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Re-fetch questions when dialog closes to see updates
      fetchExamAndQuestions();
    }
  }

  const handleDeleteQuestion = (questionId: string) => {
    startTransition(async () => {
        const result = await deleteQuestionAction({ examId, questionId });
        if (result.success) {
            toast({ title: "Success", description: result.message });
            fetchExamAndQuestions(); // Refresh data
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  }
  
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
                              <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                                <div className="space-y-2">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-4 w-1/2" />
                                </div>
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
                <Button size="sm" className="h-8 gap-1" onClick={openAddDialog}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Question
                  </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Question</TableHead>
                <TableHead>Type</TableHead>
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
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
                        {question.questionType}
                    </Badge>
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
                        <DropdownMenuItem onSelect={() => openEditDialog(question)}>
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the question.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteQuestion(question.id)}
                                        disabled={isPending}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isPending ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {questions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No questions found for this exam.
                </div>
            )}
        </CardContent>
      </Card>
      
       <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
              <DialogTitle>{selectedQuestion ? "Edit Question" : "Add a New Question"}</DialogTitle>
                  <DialogDescription>
                    {selectedQuestion ? "Make changes to the question below." : "Fill out the form below to add a question to this exam."}
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[80vh] pr-6">
                <AddQuestionForm 
                    key={selectedQuestion?.id || 'new'}
                    exam={exam} 
                    initialData={selectedQuestion}
                    onFinished={() => handleDialogChange(false)}
                />
              </ScrollArea>
          </DialogContent>
      </Dialog>
    </div>
  );
}
