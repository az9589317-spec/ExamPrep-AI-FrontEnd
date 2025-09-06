'use server';
/**
 * @fileOverview Analyzes a student's performance on practice tests and provides AI-driven suggestions for improvement.
 *
 * - analyzePerformanceAndSuggestImprovements - A function that analyzes performance and suggests improvements.
 * - PerformanceAnalysisInput - The input type for the analyzePerformanceAndSuggestImprovements function.
 * - PerformanceAnalysisOutput - The return type for the analyzePerformanceAndSuggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformanceAnalysisInputSchema = z.object({
  examCategory: z.string().describe('The category of the exam (e.g., SBI PO, IBPS PO).'),
  testType: z.string().describe('The type of test taken (e.g., Full-length mock, sectional, topic-wise).'),
  score: z.number().describe('The student’s score on the practice test.'),
  timeSpent: z.number().describe('The time spent by the student on the test in minutes.'),
  strengths: z.array(z.string()).describe('A list of topics in which the student performed well.'),
  weaknesses: z.array(z.string()).describe('A list of topics in which the student performed poorly.'),
});
export type PerformanceAnalysisInput = z.infer<typeof PerformanceAnalysisInputSchema>;

const PerformanceAnalysisOutputSchema = z.object({
  suggestedTopics: z
    .array(z.string())
    .describe('A list of topics the student should focus on to improve their score.'),
  analysisSummary: z
    .string()
    .describe('A summary of the student’s performance and areas for improvement.'),
});
export type PerformanceAnalysisOutput = z.infer<typeof PerformanceAnalysisOutputSchema>;

export async function analyzePerformanceAndSuggestImprovements(
  input: PerformanceAnalysisInput
): Promise<PerformanceAnalysisOutput> {
  return analyzePerformanceAndSuggestImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performanceAnalysisPrompt',
  input: {schema: PerformanceAnalysisInputSchema},
  output: {schema: PerformanceAnalysisOutputSchema},
  prompt: `You are an AI-powered performance analysis tool designed to help students improve their scores on competitive exams.

Analyze the student's performance data and provide targeted suggestions for topics they should focus on to improve.

Exam Category: {{{examCategory}}}
Test Type: {{{testType}}}
Score: {{{score}}}
Time Spent: {{{timeSpent}}} minutes
Strengths: {{#each strengths}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Weaknesses: {{#each weaknesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on this information, suggest specific topics for the student to focus on and provide a brief analysis summary.`,
});

const analyzePerformanceAndSuggestImprovementsFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceAndSuggestImprovementsFlow',
    inputSchema: PerformanceAnalysisInputSchema,
    outputSchema: PerformanceAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
