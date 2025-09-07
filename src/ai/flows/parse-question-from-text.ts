// src/ai/flows/parse-question-from-text.ts
'use server';
/**
 * @fileOverview An AI flow to parse unstructured text into a structured question object.
 * 
 * - parseQuestionFromText - A function that takes a raw string and parses it into a question.
 * - ParseQuestionInput - The input type for the parseQuestionFromText function.
 * - ParsedQuestionOutput - The return type for the parseQuestionFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ParseQuestionInputSchema = z.object({
  rawQuestionText: z.string().describe('The raw, unstructured text containing the question, options, answer, and potentially other details.'),
});
export type ParseQuestionInput = z.infer<typeof ParseQuestionInputSchema>;

export const ParsedQuestionOutputSchema = z.object({
  questionText: z.string().describe('The main text of the question.'),
  options: z.array(z.object({ text: z.string() })).describe('An array of possible answer options.'),
  correctOptionIndex: z.number().int().min(0).describe('The 0-based index of the correct answer in the options array.'),
  subject: z.string().optional().describe('The subject of the question (e.g., Quantitative Aptitude).'),
  topic: z.string().optional().describe('The specific topic of the question (e.g., Time and Work).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the question.'),
  explanation: z.string().optional().describe('A detailed explanation for the correct answer.'),
});
export type ParsedQuestionOutput = z.infer<typeof ParsedQuestionOutputSchema>;

export async function parseQuestionFromText(input: ParseQuestionInput): Promise<ParsedQuestionOutput> {
  return parseQuestionFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseQuestionPrompt',
  input: { schema: ParseQuestionInputSchema },
  output: { schema: ParsedQuestionOutputSchema },
  prompt: `You are an expert system designed to parse unstructured text and convert it into a structured question format.
Analyze the following text and extract the required fields.

The user will provide a text block that includes:
1. The question itself.
2. A list of multiple-choice options. These might be numbered (1, 2, 3, 4), lettered (A, B, C, D), or just listed.
3. The correct answer. This could be indicated by "Answer: C", "Correct: 2", "Ans: Option A", or similar phrasing. Your task is to determine the correct 0-based index of this answer from the options list you create.
4. Optional: An explanation for the answer.
5. Optional: The subject, topic, and difficulty level.

Carefully identify each part and structure it into the JSON output format. Ensure the 'correctOptionIndex' is accurate based on the options array you generate.

Raw Text to Parse:
'''
{{{rawQuestionText}}}
'''

Your JSON output should conform to the ParsedQuestionOutput schema.
`,
});

const parseQuestionFromTextFlow = ai.defineFlow(
  {
    name: 'parseQuestionFromTextFlow',
    inputSchema: ParseQuestionInputSchema,
    outputSchema: ParsedQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
