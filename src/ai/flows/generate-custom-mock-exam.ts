
// src/ai/flows/generate-custom-mock-exam.ts
'use server';
/**
 * @fileOverview AI-powered mock exam generator flow.
 *
 * - generateCustomMockExam - A function that generates a mock exam based on user-specified topics and difficulty levels.
 * - GenerateCustomMockExamInput - The input type for the generateCustomMockExam function.
 * - GenerateCustomMockExamOutput - The return type for the generateCustomMockExam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomMockExamInputSchema = z.object({
  section: z.string().describe('The specific section for the mock exam (e.g., Quantitative Aptitude).'),
  topic: z
    .string()
    .optional()
    .describe('A specific topic within the section to focus on for the mock exam.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the mock exam.'),
  numberOfQuestions: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('The number of questions to generate for the mock exam.'),
});
export type GenerateCustomMockExamInput = z.infer<
  typeof GenerateCustomMockExamInputSchema
>;

const GenerateCustomMockExamOutputSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string().describe('The text of the question.'),
      options: z.array(z.string()).describe('The possible answer options.'),
      correctOptionIndex: z
        .number()
        .int()
        .min(0)
        .describe('The index of the correct answer option.'),
      subject: z.string().describe('The subject of the question (e.g., Quantitative Aptitude).'),
      topic: z.string().describe('The topic of the question.'),
      difficulty: z
        .enum(['easy', 'medium', 'hard'])
        .describe('The difficulty level of the question.'),
      explanation: z.string().optional().describe('A detailed explanation for the correct answer.'),
      marks: z.number().optional().default(1).describe('Marks for the question.'),
      questionType: z.enum(['Standard', 'Reading Comprehension']).default('Standard').describe('The type of question.'),
    })
  ).describe('A list of questions for the mock exam.'),
});
export type GenerateCustomMockExamOutput = z.infer<
  typeof GenerateCustomMockExamOutputSchema
>;

export async function generateCustomMockExam(
  input: GenerateCustomMockExamInput
): Promise<GenerateCustomMockExamOutput> {
  return generateCustomMockExamFlow(input);
}

const generateCustomMockExamPrompt = ai.definePrompt({
  name: 'generateCustomMockExamPrompt',
  input: {schema: GenerateCustomMockExamInputSchema},
  output: {schema: GenerateCustomMockExamOutputSchema},
  prompt: `You are an expert in creating mock exam questions for competitive exams.
  Generate {{numberOfQuestions}} questions tailored to the following criteria:

  Section: {{section}}
  {{#if topic}}Topic: {{topic}}{{/if}}
  Difficulty: {{difficulty}}

  Each question should have a questionText, options (an array of strings), correctOptionIndex (the index of the correct option in the options array), subject, topic, and difficulty.
  The 'subject' field for each question must be '{{section}}'.
  The 'topic' field for each question should be related to the provided section and, if specified, the focused topic.
  Also include an 'explanation' and 'marks' for each question.

  Ensure the questions are relevant, challenging, and appropriate for the specified difficulty level.
  The output should be a JSON object conforming to the GenerateCustomMockExamOutputSchema schema.
  Do not include any additional information or explanations. Only provide the JSON object.`,
});

const generateCustomMockExamFlow = ai.defineFlow(
  {
    name: 'generateCustomMockExamFlow',
    inputSchema: GenerateCustomMockExamInputSchema,
    outputSchema: GenerateCustomMockExamOutputSchema,
  },
  async input => {
    const {output} = await generateCustomMockExamPrompt(input);
    return output!;
  }
);
