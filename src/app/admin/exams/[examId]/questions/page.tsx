import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddQuestionForm } from "@/components/app/add-question-form";
import { Button } from "@/components/ui/button";

export default function ExamQuestionsPage({ params }: { params: { examId: string } }) {
  // In a real app, you would fetch the exam details based on params.examId
  const exam = {
    id: params.examId,
    name: "SBI PO Prelims Mock 2", // This would be fetched
  };

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/exams">
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
      <Card>
        <CardHeader>
          <CardTitle>Add a New Question</CardTitle>
          <CardDescription>Fill out the form below to add a question to this exam.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddQuestionForm examId={exam.id} />
        </CardContent>
      </Card>
      
      {/* We will add the list of existing questions here later */}
    </div>
  );
}
