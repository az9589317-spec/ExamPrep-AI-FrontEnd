
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Exam } from '@/lib/data-structures';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Search } from 'lucide-react';
import { allCategories } from '@/lib/categories';
import { Input } from '../ui/input';

interface ExamFilterProps {
    initialExams: Exam[];
    initialCategory?: string;
    searchQuery?: string;
}

const mainCategoryNames = allCategories.map(c => c.name).filter(name => !['Daily Quiz'].includes(name));

export default function ExamFilter({ initialExams, initialCategory = 'all', searchQuery }: ExamFilterProps) {
    const [searchTerm, setSearchTerm] = useState(searchQuery || '');

    const [filters, setFilters] = useState({
        year: 'all',
        category: initialCategory,
        subCategory: 'all',
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, category: initialCategory }));
    }, [initialCategory]);

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
                (exam.topic && exam.topic.toLowerCase().includes(lowercasedSearchTerm));

            return yearMatch && categoryMatch && subCategoryMatch && searchMatch;
        });
    }, [initialExams, filters, searchTerm]);

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
    };

    return (
        <div>
            <Card className="p-4 mb-6">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    <div className="relative col-span-full sm:col-span-2 md:col-span-3 lg:col-span-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or topic..."
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
                        <Search className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Exams Found</h3>
                        <p className="mt-2 text-sm">No mock tests match your search criteria. Try adjusting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
