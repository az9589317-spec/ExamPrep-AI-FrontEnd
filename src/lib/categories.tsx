
import { BookCopy, Briefcase, TramFront, Users, Landmark, Atom, Stethoscope, LineChart, Gavel } from "lucide-react";
import React from "react";

export interface Category {
    name: string;
    icon: React.ReactNode;
    description: string;
    href: string; // Add href for explicit linking
}

export const allCategories: Category[] = [
    {
        name: 'Banking',
        icon: <Briefcase className="h-8 w-8 text-primary" />,
        description: 'Prepare for exams like SBI PO, IBPS PO, and RBI Assistant.',
        href: '/banking' // Updated link
    },
    {
        name: 'SSC',
        icon: <Users className="h-8 w-8 text-primary" />,
        description: 'Ace your SSC CGL, CHSL, and other competitive exams.',
        href: '/exams/SSC'
    },
    {
        name: 'Railway',
        icon: <TramFront className="h-8 w-8 text-primary" />,
        description: 'Get on the right track for NTPC, Group D, and other railway jobs.',
        href: '/exams/Railway'
    },
    {
        name: 'UPSC',
        icon: <Landmark className="h-8 w-8 text-primary" />,
        description: 'Crack the Civil Services Exam for various administrative jobs.',
        href: '/exams/UPSC'
    },
    {
        name: 'JEE',
        icon: <Atom className="h-8 w-8 text-primary" />,
        description: 'Prepare for Main & Advanced exams for engineering admissions.',
        href: '/exams/JEE'
    },
    {
        name: 'NEET',
        icon: <Stethoscope className="h-8 w-8 text-primary" />,
        description: 'Your gateway to top medical and dental colleges in India.',
        href: '/exams/NEET'
    },
    {
        name: 'CAT',
        icon: <LineChart className="h-8 w-8 text-primary" />,
        description: 'Secure your admission into premier MBA programs.',
        href: '/exams/CAT'
    },
    {
        name: 'CLAT',
        icon: <Gavel className="h-8 w-8 text-primary" />,
        description: 'Pursue a degree in law from National Law Universities.',
        href: '/exams/CLAT'
    },
    {
        name: 'Daily Quiz',
        icon: <BookCopy className="h-8 w-8 text-primary" />,
        description: 'Test your knowledge with quick daily quizzes on various subjects.',
        href: '/exams/Daily Quiz'
    },
    {
        name: 'Previous Year Paper',
        icon: <BookCopy className="h-8 w-8 text-primary" />,
        description: 'Practice with actual questions from past examinations.',
        href: '/exams/Previous Year Paper'
    },
];

export const categoryNames = allCategories.map(c => c.name);
