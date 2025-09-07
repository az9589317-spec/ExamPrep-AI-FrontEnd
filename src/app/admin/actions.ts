'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const addExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
  negativeMarkPerWrong: z.coerce.number().min(0),
  cutoff: z.coerce.number().min(0, 'Cut-off cannot be negative'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  visibility: z.enum(['published', 'draft']), // Changed from public/private to published/draft to match mock data
});

export async function addExamAction(prevState: any, formData: FormData) {
  const validatedFields = addExamSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await addDoc(collection(db, 'exams'), {
      name: validatedFields.data.title,
      category: validatedFields.data.category,
      durationMin: validatedFields.data.durationMin,
      negativeMarkPerWrong: validatedFields.data.negativeMarkPerWrong,
      cutoff: validatedFields.data.cutoff,
      startTime: new Date(validatedFields.data.startTime),
      endTime: new Date(validatedFields.data.endTime),
      status: validatedFields.data.visibility,
      createdAt: serverTimestamp(),
      questions: 0 // Initialize question count
    });
    
    revalidatePath('/admin');
    revalidatePath(`/admin/category/${validatedFields.data.category}`);

    return {
      message: `Exam "${validatedFields.data.title}" added successfully!`,
      errors: {},
    };
  } catch (error) {
    console.error("Error adding document: ", error);
    return {
        message: "Failed to add exam. Please try again.",
        errors: { _form: ['An unexpected error occurred.'] }
    }
  }
}

const addQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  examId: z.string(),
  questionId: z.string().optional(),
});


export async function addQuestionAction(prevState: any, formData: FormData) {
    const rawData = {
        questionText: formData.get('questionText'),
        options: (formData.getAll('options')).map(o => ({ text: o })),
        correctOptionIndex: formData.get('correctOptionIndex'),
        subject: formData.get('subject'),
        topic: formData.get('topic'),
        difficulty: formData.get('difficulty'),
        explanation: formData.get('explanation'),
        examId: formData.get('examId'),
        questionId: formData.get('questionId')
    };
    
    const validatedFields = addQuestionSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { examId, questionId, ...questionData } = validatedFields.data;

    try {
        if (questionId) {
            // Update existing question
            const questionRef = doc(db, 'exams', examId, 'questions', questionId);
            await updateDoc(questionRef, {
                ...questionData,
                updatedAt: serverTimestamp()
            });
        } else {
            // Add new question
            const questionsRef = collection(db, 'exams', examId, 'questions');
            await addDoc(questionsRef, {
                ...questionData,
                createdAt: serverTimestamp()
            });
        }

        revalidatePath(`/admin/exams/${examId}/questions`);

        return {
          message: questionId ? 'Question updated successfully!' : 'Question added successfully!',
          errors: {},
        };

    } catch (error) {
        console.error("Error saving question:", error);
        return {
            message: "Failed to save question. Please try again.",
            errors: { _form: ['An unexpected error occurred.'] }
        }
    }
}
