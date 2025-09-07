
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import type { ExamResult } from '@/services/firestore';
import { useMemo } from 'react';

interface SubjectPerformanceTableProps {
  results: ExamResult[];
}

interface SubjectStats {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
}

export default function SubjectPerformanceTable({ results }: SubjectPerformanceTableProps) {
  const performanceBySubject = useMemo(() => {
    const subjectMap: Record<string, SubjectStats> = {};

    results.forEach(result => {
      // Add a guard clause to ensure questions exist before processing
      if (!result.questions) {
        return;
      }
      result.questions.forEach((q, index) => {
        const subject = q.subject || 'General';
        if (!subjectMap[subject]) {
          subjectMap[subject] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
        }

        subjectMap[subject].total++;
        const userAnswer = result.answers[index];
        if (userAnswer === undefined) {
          subjectMap[subject].unanswered++;
        } else if (userAnswer === q.correctOptionIndex) {
          subjectMap[subject].correct++;
        } else {
          subjectMap[subject].incorrect++;
        }
      });
    });

    return Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      ...stats,
      accuracy: stats.total > stats.unanswered ? ((stats.correct / (stats.total - stats.unanswered)) * 100) : 0
    }));
  }, [results]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Subject</TableHead>
          <TableHead>Accuracy</TableHead>
          <TableHead className="text-right">Correct</TableHead>
          <TableHead className="text-right">Incorrect</TableHead>
          <TableHead className="text-right">Unanswered</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {performanceBySubject.map((row) => (
          <TableRow key={row.subject}>
            <TableCell className="font-medium">{row.subject}</TableCell>
            <TableCell>
                <div className="flex items-center gap-4">
                    <Progress value={row.accuracy} className="h-2 w-32" />
                    <span className='text-sm font-semibold'>{row.accuracy.toFixed(1)}%</span>
                </div>
            </TableCell>
            <TableCell className="text-right text-green-500">{row.correct}</TableCell>
            <TableCell className="text-right text-red-500">{row.incorrect}</TableCell>
            <TableCell className="text-right">{row.unanswered}</TableCell>
            <TableCell className="text-right font-bold">{row.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
