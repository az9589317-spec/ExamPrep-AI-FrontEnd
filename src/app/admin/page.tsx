import Link from "next/link";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AddExamForm } from "@/components/app/add-exam-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Mock data for exams. In a real app, this would come from Firestore.
const exams = [
  { id: 'sbi-po-prelims-mock-2', name: 'SBI PO Prelims Mock 2', category: 'Bank PO', status: 'published', questions: 100 },
  { id: 'ibps-po-mains-mock-1', name: 'IBPS PO Mains Mock 1', category: 'Bank PO', status: 'draft', questions: 155 },
  { id: 'rbi-assistant-prelims-pyq-2022', name: 'RBI Assistant Prelims 2022', category: 'Previous Year Paper', status: 'published', questions: 100 },
];

export default function AdminDashboard() {
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground">Manage all exams on the platform.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Exam
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add a New Exam</DialogTitle>
                    </DialogHeader>
                    <AddExamForm />
                </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/exams/${exam.id}/questions`} className="hover:underline">
                      {exam.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.status === 'published' ? 'default' : 'secondary'} className={`${exam.status === 'published' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : ''}`}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{exam.questions}</TableCell>
                  <TableCell className="hidden md:table-cell">{exam.category}</TableCell>
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
                        <DropdownMenuItem>
                            <Link href={`/admin/exams/${exam.id}/questions`} className="w-full">
                                Manage Questions
                            </Link>
                        </DropdownMenuItem>
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
  );
}
