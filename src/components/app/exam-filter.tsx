
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Exam } from '@/lib/data-structures';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { allCategories } from '@/lib/categories';

interface ExamFilterProps {
    initialExams: Exam[];
    initialCategory?: string;
}

const mainCategoryNames = allCategories.map(c => c.name).filter(name => !['Daily Quiz'].includes(name));

export default function ExamFilter({ initialExams, initialCategory = 'all' }: ExamFilterProps) {
    const [filters, setFilters] = useState({
        year: 'all',
        category: initialCategory,
        subCategory: 'all',
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, category: initialCategory }));
    }, [initialCategory]);


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
            exam.subCategory.forEach(sub => subCategories.add(sub));
        });

        return {
            availableYears: ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))],
            availableCategories: ['all', ...mainCategoryNames],
            availableSubCategories: ['all', ...Array.from(subCategories).sort()],
        };
    }, [initialExams, filters.category]);

    const filteredExams = useMemo(() => {
        return initialExams.filter(exam => {
            const yearMatch = filters.year === 'all' || exam.year?.toString() === filters.year;
            const categoryMatch = filters.category === 'all' || exam.category === filters.category;
            const subCategoryMatch = filters.subCategory === 'all' || exam.subCategory.includes(filters.subCategory);
            return yearMatch && categoryMatch && subCategoryMatch;
        });
    }, [initialExams, filters]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'category' && value !== 'all') {
                newFilters.subCategory = 'all'; // Reset subCategory when main category changes
            }
            return newFilters;
        });
    };

    const resetFilters = () => {
        setFilters({ year: 'all', category: 'all', subCategory: 'all' });
    };

    return (
        <div>
            <Card className="p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
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
                    <Button onClick={resetFilters} variant="ghost" className="md:col-start-4 lg:col-start-5">Reset Filters</Button>
                </div>
            </Card>

            <div className="divide-y divide-border rounded-md border">
                {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                        <div
                            key={exam.id}
                            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <h3 className="font-medium">{exam.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span>{exam.totalQuestions || 0} Questions</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{exam.totalMarks || 0} Marks</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{exam.durationMin} mins</span>
                                    <span className='hidden sm:inline'>•</span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>Negative Marking: No</span>
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                <Link href={`/exam/${exam.id}`}>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                        Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No exams match the selected filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
