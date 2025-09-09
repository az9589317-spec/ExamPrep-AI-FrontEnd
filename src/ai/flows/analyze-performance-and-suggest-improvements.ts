
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
    .describe('A list of the top 3-5 topics the student should focus on to improve their score.'),
  analysisSummary: z
    .string()
    .describe('A concise, encouraging summary of the student’s performance and a high-level strategy for improvement.'),
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
  prompt: `You are an AI-powered performance analysis tool for competitive exam aspirants. Your tone should be encouraging but direct.

Analyze the student's performance data based on their latest test. Provide targeted, actionable advice.

Exam Category: {{{examCategory}}}
Test Type: {{{testType}}}
Score: {{{score}}}
Time Spent: {{{timeSpent}}} minutes

Topics where the student did well (Strengths): {{#if strengths}}{{#each strengths}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None identified{{/if}}
Topics where the student struggled (Weaknesses): {{#if weaknesses}}{{#each weaknesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None identified{{/if}}

Based on this information:
1.  Identify the top 3-5 most critical topics from the "Weaknesses" list that the student should focus on. These should be the topics that will likely have the highest impact on their score improvement.
2.  Provide a concise analysis summary. Start by acknowledging their effort. Mention one positive aspect from their strengths. Then, frame the weaknesses as "opportunity areas" and briefly explain why focusing on the suggested topics is the best strategy. Keep the summary to 2-3 sentences.
`,
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
