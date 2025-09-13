

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Exam } from '@/lib/data-structures';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Download, Loader2, MoreVertical, PlayCircle, Search, XCircle, BookOpen } from 'lucide-react';
import { allCategories } from '@/lib/categories';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getQuestionsForExam } from '@/services/firestore';
import type { Question } from '@/lib/data-structures';
import { useAuth } from './auth-provider';
import { logExamDownload } from '@/services/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ExamActions({ exam }: { exam: Exam }) {
    const { user } = useAuth();
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    const generateHtmlForPdf = (questions: Question[], withAnswers: boolean) => {
        let content = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${exam.name}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { font-size: 24px; }
                    h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; }
                    .question { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
                    .question p { margin: 0 0 10px; }
                    .question img { max-width: 100%; height: auto; border-radius: 5px; margin: 10px 0; }
                    .options { list-style-type: none; padding-left: 0; }
                    .options li { margin-bottom: 5px; }
                    .answer { font-weight: bold; color: #28a745; }
                    .explanation { background-color: #f8f9fa; border-left: 3px solid #007bff; padding: 10px; margin-top: 10px; }
                    .passage { background-color: #f1f1f1; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                    .print-btn { 
                        position: fixed; top: 20px; right: 20px; 
                        padding: 10px 20px; background-color: #007bff; color: white; 
                        border: none; border-radius: 5px; cursor: pointer;
                        font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    }
                    @media print {
                        body { padding: 10px; }
                        .no-print, .print-btn { display: none; }
                        h1, h2, .question { page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
                <h1>${exam.name}</h1>
                <p>Category: ${exam.category} | Total Questions: ${exam.totalQuestions} | Duration: ${exam.durationMin} minutes</p>
                <hr />
        `;
    
        questions.forEach((question, index) => {
            content += `<div class="question"><h2>Question ${index + 1}</h2>`;
            if (question.questionType === 'Reading Comprehension') {
                content += `<div class="passage"><strong>Passage:</strong><br/>${question.passage || 'N/A'}</div>`;
                if (question.imageUrl) {
                    content += `<img src="${question.imageUrl}" alt="Passage Image">`;
                }
                question.subQuestions?.forEach((subQ, subIndex) => {
                    content += `<div><strong>Sub-Question ${subIndex + 1}:</strong> ${subQ.questionText}</div>`;
                    content += '<ul class="options">';
                    subQ.options.forEach((opt, i) => {
                        content += `<li>(${String.fromCharCode(97 + i)}) ${opt.text}</li>`;
                    });
                    content += '</ul>';
                    if (withAnswers) {
                        content += `<div class="answer">Correct Answer: (${String.fromCharCode(97 + subQ.correctOptionIndex)}) ${subQ.options[subQ.correctOptionIndex]?.text}</div>`;
                        if(subQ.explanation) content += `<div class="explanation"><strong>Explanation:</strong> ${subQ.explanation}</div>`;
                    }
                    content += `<br/>`;
                });
            } else {
                content += `<p>${question.questionText}</p>`;
                if (question.imageUrl) {
                    content += `<img src="${question.imageUrl}" alt="Question Image">`;
                }
                content += '<ul class="options">';
                question.options?.forEach((opt, i) => {
                    content += `<li>(${String.fromCharCode(97 + i)}) ${opt.text}</li>`;
                });
                content += '</ul>';
                if (withAnswers) {
                    content += `<div class="answer">Correct Answer: (${String.fromCharCode(97 + question.correctOptionIndex!)}) ${question.options?.[question.correctOptionIndex!]?.text}</div>`;
                    if(question.explanation) content += `<div class="explanation"><strong>Explanation:</strong> ${question.explanation}</div>`;
                }
            }
            content += `</div>`;
        });
    
        content += `
            </body>
            </html>
        `;
        return content;
    };
    
    const handleDownload = async (withAnswers: boolean, format: 'txt' | 'pdf') => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to download questions." });
            return;
        }

        setIsDownloading(true);
        toast({ title: "Preparing Download", description: `Fetching questions for ${exam.name}...` });
        
        try {
            // Log the download action first
            await logExamDownload(user.uid, exam.id);
            
            const questions = await getQuestionsForExam(exam.id);
            if (questions.length === 0) {
                toast({ variant: "destructive", title: "Download Failed", description: "No questions found for this exam." });
                setIsDownloading(false);
                return;
            }

            if (format === 'pdf') {
                const htmlContent = generateHtmlForPdf(questions, withAnswers);
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                window.open(url);
                toast({ variant: "default", title: "PDF Ready", description: "Please use the 'Print' button in the new tab to save as PDF.", duration: 8000 });

            } else {
                let content = `Exam: ${exam.name}\n`;
                content += `Category: ${exam.category}\n`;
                content += `Total Questions: ${exam.totalQuestions}\n`;
                content += `Duration: ${exam.durationMin} minutes\n`;
                content += `--------------------------------------------------\n\n`;

                questions.forEach((question, index) => {
                    content += `Question ${index + 1}:\n`;
                    if (question.questionType === 'Reading Comprehension') {
                        content += `Passage: ${question.passage || 'N/A'}\n\n`;
                        if (question.imageUrl) {
                            content += `Image URL: ${question.imageUrl}\n\n`;
                        }
                        question.subQuestions?.forEach((subQ, subIndex) => {
                            content += `  Sub-Question ${subIndex + 1}: ${subQ.questionText}\n`;
                            subQ.options.forEach((opt, i) => {
                                content += `    (${String.fromCharCode(97 + i)}) ${opt.text}\n`;
                            });
                            if (withAnswers) {
                                content += `  Correct Answer: (${String.fromCharCode(97 + subQ.correctOptionIndex)}) ${subQ.options[subQ.correctOptionIndex]?.text}\n`;
                                if(subQ.explanation) content += `  Explanation: ${subQ.explanation}\n`;
                            }
                            content += `\n`;
                        });
                    } else {
                        content += `${question.questionText}\n\n`;
                        if (question.imageUrl) {
                            content += `Image URL: ${question.imageUrl}\n\n`;
                        }
                        question.options?.forEach((opt, i) => {
                            content += `  (${String.fromCharCode(97 + i)}) ${opt.text}\n`;
                        });
                        if (withAnswers) {
                            content += `\nCorrect Answer: (${String.fromCharCode(97 + question.correctOptionIndex!)}) ${question.options?.[question.correctOptionIndex!]?.text}\n`;
                            if(question.explanation) content += `Explanation: ${question.explanation}\n`;
                        }
                    }
                    content += `\n--------------------------------------------------\n\n`;
                });

                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                const fileNameSuffix = withAnswers ? '_with_answers' : '';
                link.download = `${exam.name.replace(/ /g, '_')}_Questions${fileNameSuffix}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ variant: "default", title: "Download Started", description: "Your file is being downloaded." });
            }

        } catch (error) {
            console.error("Failed to download questions:", error);
            toast({ variant: "destructive", title: "Download Failed", description: "Could not fetch the questions for this exam." });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDownloading}>
                    {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreVertical className="h-4 w-4" />
                    )}
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/exam/${exam.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Exam
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Download className="mr-2 h-4 w-4" />
                        Download as TXT
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleDownload(false, 'txt')}>Without Answers</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(true, 'txt')}>With Answers</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Download className="mr-2 h-4 w-4" />
                        Download as PDF
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleDownload(false, 'pdf')}>Without Answers</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(true, 'pdf')}>With Answers</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


interface ExamFilterProps {
    initialExams: Exam[];
    initialCategory?: string;
    initialSubCategory?: string;
    searchQuery?: string;
}

const mainCategoryNames = allCategories.map(c => c.name).filter(name => !['Daily Quiz'].includes(name));

export default function ExamFilter({ initialExams, initialCategory = 'all', initialSubCategory = 'all', searchQuery }: ExamFilterProps) {
    const [searchTerm, setSearchTerm] = useState(searchQuery || '');
    const [activeTab, setActiveTab] = useState('all');

    const [filters, setFilters] = useState({
        year: 'all',
        category: initialCategory,
        subCategory: initialSubCategory,
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, category: initialCategory, subCategory: initialSubCategory }));
    }, [initialCategory, initialSubCategory]);

    useEffect(() => {
        setSearchTerm(searchQuery || '');
    }, [searchQuery]);


    const { availableYears, availableCategories, availableSubCategories } = useMemo(() => {
        const years = new Set<string>();
        const categories = new Set<string>();
        const subCategories = new Set<string>();

        const examsToScan = filters.category === 'all' 
            ? initialExams
            : initialExams.filter(exam => exam.category === filters.category);

        examsToScan.forEach(exam => {
            if (exam.year) years.add(exam.year.toString());
            categories.add(exam.category);
            exam.subCategory?.forEach(sub => subCategories.add(sub));
        });
        
        return {
            availableYears: ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))],
            availableCategories: ['all', ...mainCategoryNames.sort()],
            availableSubCategories: ['all', ...Array.from(subCategories).sort()],
        };
    }, [initialExams, filters.category]);

    useEffect(() => {
        // When availableSubCategories changes, check if the current selection is still valid.
        if (filters.subCategory !== 'all' && !availableSubCategories.includes(filters.subCategory)) {
            setFilters(prev => ({ ...prev, subCategory: 'all' }));
        }
    }, [availableSubCategories, filters.subCategory]);

    const filteredExams = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        return initialExams.filter(exam => {
            const yearMatch = filters.year === 'all' || exam.year?.toString() === filters.year;
            const categoryMatch = filters.category === 'all' || exam.category === filters.category;
            const subCategoryMatch = filters.subCategory === 'all' || exam.subCategory?.includes(filters.subCategory);
            
            const searchMatch = !lowercasedSearchTerm || 
                exam.name.toLowerCase().includes(lowercasedSearchTerm) ||
                (typeof exam.category === 'string' && exam.category.toLowerCase().includes(lowercasedSearchTerm)) ||
                (exam.topic && (exam as any).topic.toLowerCase().includes(lowercasedSearchTerm));
            
            const examTypeMatch = activeTab === 'all' || (activeTab === 'full' && exam.examType === 'Full Mock') || (activeTab === 'sectional' && exam.examType === 'Sectional Mock');

            return yearMatch && categoryMatch && subCategoryMatch && searchMatch && examTypeMatch;
        });
    }, [initialExams, filters, searchTerm, activeTab]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'category' && value !== prev.category) {
                // When main category changes, reset sub-category
                newFilters.subCategory = 'all'; 
            }
            return newFilters;
        });
    };

    const resetFilters = () => {
        setFilters({ year: 'all', category: 'all', subCategory: 'all' });
        setSearchTerm('');
        setActiveTab('all');
    };

    const getNegativeMarkingDisplay = (exam: Exam): { display: string; hasNegative: boolean } => {
        if (!exam.sections || exam.sections.length === 0) {
            return { display: "No", hasNegative: false };
        }

        const negativeValues = exam.sections
            .filter(sec => sec.negativeMarking && sec.negativeMarkValue !== undefined)
            .map(sec => sec.negativeMarkValue!);
        
        if (negativeValues.length === 0) {
            return { display: "No", hasNegative: false };
        }

        const valueCounts: Record<number, number> = {};
        let maxCount = 0;
        let mostCommonValue: number | undefined;

        for (const value of negativeValues) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
            if (valueCounts[value] > maxCount) {
                maxCount = valueCounts[value];
                mostCommonValue = value;
            }
        }
        
        const uniqueValues = Object.keys(valueCounts);
        if (uniqueValues.length === 1) {
             return { display: `-${mostCommonValue}`, hasNegative: true };
        }
        if (uniqueValues.length > 1 && mostCommonValue !== undefined) {
            const allCounts = Object.values(valueCounts);
            const sortedCounts = [...allCounts].sort((a, b) => b - a);
            if (sortedCounts.length > 1 && sortedCounts[0] === sortedCounts[1]) {
                 return { display: "Varies", hasNegative: true };
            }
            return { display: `-${mostCommonValue}`, hasNegative: true };
        }
        
        return { display: "Yes", hasNegative: true };
    };


    return (
        <div>
            <Card className="p-4 mb-6">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    <div className="relative col-span-full sm:col-span-2 md:col-span-3 lg:col-span-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, category, or topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-full"
                        />
                    </div>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                            {availableCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.subCategory} onValueChange={(value) => handleFilterChange('subCategory', value)} disabled={filters.category === 'all'}>
                        <SelectTrigger><SelectValue placeholder="Select Sub-category" /></SelectTrigger>
                        <SelectContent>
                            {availableSubCategories.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub === 'all' ? 'All Sub-categories' : sub}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year}>{year === 'all' ? 'All Years' : year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={resetFilters} variant="ghost" className="w-full">Reset Filters</Button>
                </div>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="full">Full Mock</TabsTrigger>
                    <TabsTrigger value="sectional">Sectional Mock</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="divide-y divide-border rounded-md border">
                {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => {
                        const { display: negDisplay, hasNegative: hasNegativeMarking } = getNegativeMarkingDisplay(exam);
                        return (
                        <div
                            key={exam.id}
                            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex-1">
                                <h3 className="font-medium">{exam.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span>{exam.totalQuestions || 0} Questions</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{exam.totalMarks || 0} Marks</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{exam.durationMin} mins</span>
                                    <span className='hidden sm:inline'>•</span>
                                    <span className="flex items-center gap-1">
                                        {hasNegativeMarking ? (
                                            <XCircle className="h-3 w-3 text-red-500" />
                                        ) : (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        )}
                                        <span>Negative Marking: {negDisplay}</span>
                                    </span>
                                </div>
                                {exam.sections && exam.sections.length > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <BookOpen className="h-4 w-4" />
                                        <span className="font-medium">Sections:</span>
                                        <span>{exam.sections.map(s => s.name).join(', ')}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 sm:mt-0 flex flex-row items-center gap-2">
                                <Link href={`/exam/${exam.id}`} className="w-full sm:w-auto">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <ExamActions exam={exam} />
                            </div>
                        </div>
                    )})
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <Search className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Exams Found</h3>
                        <p className="mt-2 text-sm">No mock tests match your search criteria. Try adjusting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
