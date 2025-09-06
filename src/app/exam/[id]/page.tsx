import { ChevronLeft, ChevronRight, Clock, Bookmark, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ExamPage({ params }: { params: { id: string } }) {
    // In a real app, fetch exam questions based on params.id
    // This is a placeholder for the UI structure.
    const exam = {
        title: params.id === 'custom-exam-123' ? 'Custom Generated Exam' : 'SBI PO Prelims Mock 2',
        totalQuestions: 20,
    };
    const question = {
        number: 1,
        text: "If a train 110 meters long passes a telegraph pole in 3 seconds, then the time taken by it to cross a railway platform 165 meters long is:",
        options: ["9 seconds", "10 seconds", "7.5 seconds", "12.5 seconds"],
        topic: "Time, Speed, and Distance",
    };

    const questionPalette = Array.from({ length: exam.totalQuestions }, (_, i) => ({
        number: i + 1,
        status: i === 0 ? 'current' : i < 4 ? 'not-answered' : i < 8 ? 'answered' : 'marked',
    }));

    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
             <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
                <h1 className="text-lg font-semibold md:text-xl font-headline">{exam.title}</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-lg">
                        <Clock className="h-5 w-5" />
                        <span>58:23</span>
                    </div>
                    <Link href="/">
                        <Button>Submit</Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
                <div className="grid gap-6 md:grid-cols-[1fr_320px]">
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Question {question.number}</CardTitle>
                                        <CardDescription>Topic: {question.topic}</CardDescription>
                                    </div>
                                    <Button variant="outline" size="icon">
                                        <Bookmark className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-6 text-base leading-relaxed">{question.text}</p>
                                <RadioGroup defaultValue="option-2" className="gap-4">
                                    {question.options.map((option, index) => (
                                        <Label key={index} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 has-[input:checked]:bg-accent/80 has-[input:checked]:border-primary">
                                            <RadioGroupItem value={`option-${index}`} id={`option-${index}`} />
                                            <span>{option}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        <div className="flex justify-between items-center">
                            <Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary">Mark for Review & Next</Button>
                                <Button>Save & Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ListChecks /> Question Palette</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-5 gap-2">
                                {questionPalette.map(q => (
                                    <Button key={q.number} variant={
                                        q.status === 'current' ? 'default' :
                                        q.status === 'answered' ? 'secondary' :
                                        q.status === 'marked' ? 'outline' : 'ghost'
                                    } 
                                    className={`
                                        ${q.status === 'answered' && 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'}
                                        ${q.status === 'marked' && 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 border-purple-400'}
                                        ${q.status === 'not-answered' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
                                    `}
                                    size="icon">
                                        {q.number}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                               <CardTitle>Legend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Badge className="bg-green-200 w-6 h-6 p-0"/> Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-red-100 w-6 h-6 p-0"/> Not Answered</div>
                                <div className="flex items-center gap-2"><Badge className="bg-purple-200 w-6 h-6 p-0"/> Marked for Review</div>
                                <div className="flex items-center gap-2"><Badge className="bg-gray-200 w-6 h-6 p-0"/> Not Visited</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
