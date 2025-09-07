
'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddExamForm } from "@/components/app/add-exam-form";
import { getExams, type Exam } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategoryPage() {
    const params = useParams();
    const category = decodeURIComponent(params.category as string);
    const { toast } = useToast();

    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchExams() {
            try {
                const fetchedExams = await getExams(category);
                setExams(fetchedExams);
            } catch (error) {
                console.error(`Failed to fetch exams for category ${category}:`, error);
                toast({ variant: "destructive", title: "Error", description: "Could not load exams for this category." });
            } finally {
                setIsLoading(false);
            }
        }
        if (category) {
            fetchExams();
        }
    }, [category, toast]);

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-muted-foreground">Category: </span>
                            {category}
                        </h1>
                        <p className="text-muted-foreground">Manage exams in the {category} category.</p>
                    </div>
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
                                <DialogDescription>Fill out the form below to create a new exam.</DialogDescription>
                            </DialogHeader>
                            <AddExamForm defaultCategory={category} />
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
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-10" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : exams.length > 0 ? (
                                exams.map((exam) => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/admin/exams/${exam.id}/questions`} className="hover:underline">
                                                {exam.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                                                {exam.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{exam.questions || 0}</TableCell>
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No exams found in this category.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
