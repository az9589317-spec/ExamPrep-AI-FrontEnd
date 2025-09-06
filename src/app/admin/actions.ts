'use server';

import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
  negativeMarkPerWrong: z.coerce.number().min(0),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  visibility: z.enum(['public', 'private']),
});

export async function addExamAction(prevState: any, formData: FormData) {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // In a real app, you would save the data to Firestore.
  // For now, we'll just log it.
  console.log('New exam data:', validatedFields.data);

  return {
    message: `Exam "${validatedFields.data.title}" added successfully!`,
    errors: {},
  };
}
