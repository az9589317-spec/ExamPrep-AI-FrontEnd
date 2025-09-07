

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDoc, query, where, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { exams as mockExams, questions as mockQuestions } from '@/lib/mock-data';
import { parseQuestionFromText } from '@/ai/flows/parse-question-from-text';

const addExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
  negativeMarkPerWrong: z.coerce.number().min(0),
  cutoff: z.coerce.number().min(0, 'Cut-off cannot be negative'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllTime: z.boolean(),
  visibility: z.enum(['published', 'draft']),
});


export async function addExamAction(data: z.infer<typeof addExamSchema>) {
  const validatedFields = addExamSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    }
  }
  
  const { isAllTime, startTime: startTimeStr, endTime: endTimeStr, title, visibility, ...examData } = validatedFields.data;

  if (!isAllTime && (!startTimeStr || !endTimeStr)) {
      return {
          errors: {
              startTime: ['Start and end times are required unless the exam is available at all times.'],
          },
          message: null,
      }
  }


  try {
    const newExamRef = doc(collection(db, 'exams'));
    
    const dataToSave: any = {
      ...examData,
      name: title,
      status: visibility,
      questions: 0,
      createdAt: new Date(),
    };
    
    if (!isAllTime && startTimeStr && endTimeStr) {
      dataToSave.startTime = new Date(startTimeStr);
      dataToSave.endTime = new Date(endTimeStr);
    } else {
      dataToSave.startTime = null;
      dataToSave.endTime = null;
    }

    await setDoc(newExamRef, dataToSave);
    
    revalidatePath('/admin');
    revalidatePath(`/admin/category/${examData.category}`);

    return {
      message: `Exam "${title}" added successfully!`,
      errors: null
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


export async function addQuestionAction(data: z.infer<typeof addQuestionSchema>) {
    const validatedFields = addQuestionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { examId, questionId, ...questionData } = validatedFields.data;

    try {
        const questionPayload: any = {
            ...questionData,
        };
        
        if (questionId) {
            // Update existing question
            questionPayload.updatedAt = new Date();
            const questionRef = doc(db, 'exams', examId, 'questions', questionId);
            await updateDoc(questionRef, questionPayload);
        } else {
            // Add new question
            questionPayload.createdAt = new Date();
            const questionsRef = collection(db, 'exams', examId, 'questions');
            await addDoc(questionsRef, questionPayload);
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


export async function seedDatabaseAction() {
    console.log("Starting database seed...");
    try {
        const batch = writeBatch(db);

        for (const mockExam of mockExams) {
            const examRef = doc(db, 'exams', mockExam.id);
            const examData = { ...mockExam };
            
            delete (examData as any).questions; 
            
            const examPayload = {
                ...examData,
                questions: mockQuestions[mockExam.id]?.length || 0,
                startTime: null,
                endTime: null,
                createdAt: new Date(),
            };
            batch.set(examRef, examPayload);

            const questionsToSeed = mockQuestions[mockExam.id];
            if (questionsToSeed) {
                for (const question of questionsToSeed) {
                    const questionRef = doc(db, 'exams', mockExam.id, 'questions', question.id);
                    const { id: qId, ...questionPayload } = question;
                    batch.set(questionRef, {
                        ...questionPayload,
                        createdAt: new Date()
                    });
                }
            }
        }

        await batch.commit();

        console.log("Database seeded successfully!");
        revalidatePath('/admin');
        return { success: true, message: 'Database seeded successfully with mock data!' };

    } catch (error) {
        console.error("Error seeding database:", error);
        return { success: false, message: 'Failed to seed database. Check server logs for details.' };
    }
}


export async function parseQuestionAction(text: string) {
    try {
        const parsedData = await parseQuestionFromText({ rawQuestionText: text });
        if (!parsedData) {
            throw new Error("AI failed to parse the question.");
        }
        return { success: true, data: parsedData };
    } catch (error) {
        console.error("Error in parseQuestionAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during parsing.";
        return { success: false, error: errorMessage };
    }
}
