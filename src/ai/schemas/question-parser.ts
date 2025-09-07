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
