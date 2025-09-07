
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, type Timestamp, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { exams as mockExams, questions as mockQuestions } from '@/lib/mock-data';

const addExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
  negativeMarkPerWrong: z.coerce.number().min(0),
  cutoff: z.coerce.number().min(0, 'Cut-off cannot be negative'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // `isAllTime` comes from a checkbox, which sends "on" or is undefined.
  // We transform it into a boolean.
  isAllTime: z.preprocess((val) => val === 'on', z.boolean()),
  visibility: z.enum(['published', 'draft']),
}).refine(data => {
    if (!data.isAllTime) {
        return !!data.startTime && !!data.endTime;
    }
    return true;
}, {
    message: "Start and end times are required unless the exam is available at all times.",
    path: ['startTime'],
});

export async function addExamAction(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = addExamSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { isAllTime, startTime: startTimeStr, endTime: endTimeStr, ...examData } = validatedFields.data;

  try {
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    
    if (!isAllTime && startTimeStr && endTimeStr) {
        startTime = new Date(startTimeStr);
        endTime = new Date(endTimeStr);
    }

    await addDoc(collection(db, 'exams'), {
      ...examData,
      startTime: startTime,
      endTime: endTime,
      status: examData.visibility,
      createdAt: serverTimestamp(),
      questions: 0 // Initialize question count
    });
    
    revalidatePath('/admin');
    revalidatePath(`/admin/category/${examData.category}`);

    return {
      message: `Exam "${examData.title}" added successfully!`,
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
        options: (formData.getAll('options')).map(o => ({ text: o as string })),
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


export async function seedDatabaseAction() {
    try {
        console.log("Starting database seed...");
        const batch = writeBatch(db);
        const examsCollection = collection(db, 'exams');

        for (const mockExam of mockExams) {
            // Check if exam with the same mock ID already exists
            const q = query(examsCollection, where("mockId", "==", mockExam.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log(`Seeding exam: ${mockExam.name}`);
                const examRef = doc(examsCollection);
                batch.set(examRef, {
                    mockId: mockExam.id, // Store mock ID to prevent duplicates
                    name: mockExam.name,
                    category: mockExam.category,
                    status: mockExam.status,
                    durationMin: mockExam.durationMin,
                    cutoff: mockExam.cutoff,
                    negativeMarkPerWrong: mockExam.negativeMarkPerWrong,
                    createdAt: serverTimestamp(),
                    questions: mockQuestions[mockExam.id]?.length || 0,
                    startTime: null,
                    endTime: null,
                });

                // Seed questions for this new exam
                const questionsToSeed = mockQuestions[mockExam.id];
                if (questionsToSeed) {
                    const questionsRef = collection(db, 'exams', examRef.id, 'questions');
                    for (const question of questionsToSeed) {
                        const questionRef = doc(questionsRef, question.id);
                        batch.set(questionRef, {
                            ...question,
                            createdAt: serverTimestamp()
                        });
                    }
                }
            } else {
                console.log(`Skipping existing exam: ${mockExam.name}`);
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
