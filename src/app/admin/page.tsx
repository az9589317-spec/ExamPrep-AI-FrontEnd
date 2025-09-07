
'use client';
import Link from "next/link";
import { PlusCircle, ArrowRight, BookCopy, Briefcase, TramFront, Users, Landmark, Atom, Stethoscope, LineChart, Gavel, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddExamForm } from "@/components/app/add-exam-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exams as allExams } from "@/lib/mock-data";
import { seedDatabaseAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
    const { toast } = useToast();
    const categories = Array.from(new Set(allExams.map(exam => exam.category)));

    const categoryIcons: Record<string, React.ReactNode> = {
        'Banking': <Briefcase className="h-8 w-8 text-primary" />,
        'SSC': <Users className="h-8 w-8 text-primary" />,
        'Railway': <TramFront className="h-8 w-8 text-primary" />,
        'UPSC': <Landmark className="h-8 w-8 text-primary" />,
        'JEE': <Atom className="h-8 w-8 text-primary" />,
        'NEET': <Stethoscope className="h-8 w-8 text-primary" />,
        'CAT': <LineChart className="h-8 w-8 text-primary" />,
        'CLAT': <Gavel className="h-8 w-8 text-primary" />,
        'Daily Quiz': <BookCopy className="h-8 w-8 text-primary" />,
        'Previous Year Paper': <BookCopy className="h-8 w-8 text-primary" />,
    };

    const examCountByCategory = allExams.reduce((acc, exam) => {
        acc[exam.category] = (acc[exam.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const handleSeedDatabase = async () => {
        toast({ title: 'Seeding Database...', description: 'Please wait, this may take a moment.' });
        const result = await seedDatabaseAction();
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground">Manage all exams on the platform.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleSeedDatabase}>
                <Database className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Seed Database
                </span>
            </Button>
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
                    <AddExamForm />
                </DialogContent>
            </Dialog>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
            <Link href={`/admin/category/${encodeURIComponent(category)}`} key={category}>
                <Card className="flex flex-col justify-between h-full hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {categoryIcons[category] || <Briefcase className="h-8 w-8 text-gray-500" />}
                                <CardTitle className="font-headline">{category}</CardTitle>
                            </div>
                            <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                {examCountByCategory[category] || 0}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-end text-sm font-medium text-primary">
                            Manage Exams <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
