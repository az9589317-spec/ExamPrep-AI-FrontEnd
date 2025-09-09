

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDoc, query, where, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { exams as mockExams, questions as mockQuestions } from '@/lib/mock-data';
import { parseQuestionFromText } from '@/ai/flows/parse-question-from-text';
import { v4 as uuidv4 } from 'uuid';


const sectionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(2, "Section name must be at least 2 characters."),
  questionsCount: z.coerce.number().min(1, "Must have at least 1 question."),
  marksPerQuestion: z.coerce.number().min(0.25, "Marks must be at least 0.25."),
  timeLimit: z.coerce.number().optional(),
  cutoffMarks: z.coerce.number().optional(),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.coerce.number().optional(),
  allowQuestionNavigation: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  showCalculator: z.boolean().default(false),
  instructions: z.string().optional(),
});


const addExamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Exam name is required and must be at least 3 characters.'),
  category: z.string().min(1, 'Category is required.'),
  examType: z.enum(['Prelims', 'Mains', 'Mock Test', 'Practice', 'Custom']),
  status: z.enum(['published', 'draft', 'archived']),
  sections: z.array(sectionSchema).min(1, "An exam must have at least one section."),
  durationMin: z.coerce.number().min(1, "Total duration must be at least 1 minute."),
  hasOverallTimer: z.boolean().default(true),
  hasSectionTimer: z.boolean().default(true),
  allowBackNavigation: z.boolean().default(true),
  autoSubmit: z.boolean().default(true),
  showResults: z.boolean().default(true),
  allowReAttempt: z.boolean().default(false),
  maxAttempts: z.coerce.number().optional(),
  passingCriteria: z.enum(['overall', 'sectional', 'both']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  requireProctoring: z.boolean().default(false),
  lockBrowser: z.boolean().default(false),
  preventCopyPaste: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showQuestionNumbers: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  showExplanations: z.boolean().default(true),
  allowResultDownload: z.boolean().default(false),
});


export async function addExamAction(data: z.infer<typeof addExamSchema>) {
  const validatedFields = addExamSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    }
  }
  
  const { id: examId, startTime: startTimeStr, endTime: endTimeStr, ...examData } = validatedFields.data;
  const isEditing = !!examId;

  try {
    const totalQuestions = examData.sections.reduce((acc, s) => acc + s.questionsCount, 0);
    const totalMarks = examData.sections.reduce((acc, s) => acc + s.marksPerQuestion * s.questionsCount, 0);
    
    const dataToSave: any = {
      ...examData,
      totalQuestions,
      totalMarks,
      updatedAt: new Date(),
    };
    
    if (startTimeStr && endTimeStr) {
      dataToSave.startTime = new Date(startTimeStr);
      dataToSave.endTime = new Date(endTimeStr);
    } else {
      dataToSave.startTime = null;
      dataToSave.endTime = null;
    }

    if (isEditing) {
        const examRef = doc(db, 'exams', examId);
        await updateDoc(examRef, dataToSave);
    } else {
        const newExamRef = doc(collection(db, 'exams'));
        dataToSave.createdAt = new Date();
        dataToSave.questions = 0;
        await setDoc(newExamRef, dataToSave);
    }
    
    revalidatePath('/admin');
    revalidatePath(`/admin/category/${examData.category}`);

    return {
      message: `Exam "${data.name}" ${isEditing ? 'updated' : 'added'} successfully!`,
      errors: null
    };
  } catch (error) {
    console.error(`Error ${isEditing ? 'updating' : 'adding'} document: `, error);
    return {
        message: `Failed to ${isEditing ? 'update' : 'add'} exam. Please try again.`,
        errors: { _form: ['An unexpected error occurred.'] }
    }
  }
}

const subQuestionSchema = z.object({
    id: z.string().default(() => uuidv4()),
    questionText: z.string().min(1, "Sub-question text is required."),
    options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2),
    correctOptionIndex: z.coerce.number().min(0),
    explanation: z.string().optional(),
});

const addQuestionSchema = z.object({
  questionType: z.enum(['Standard', 'Reading Comprehension']),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  examId: z.string(),
  questionId: z.string().optional(),
  
  // Standard Question Fields
  questionText: z.string().optional(),
  options: z.array(z.object({ text: z.string() })).optional(),
  correctOptionIndex: z.coerce.number().optional(),

  // Reading Comprehension Fields
  passage: z.string().optional(),
  subQuestions: z.array(subQuestionSchema).optional(),
}).refine(data => {
    if (data.questionType === 'Standard') {
        return data.questionText && data.questionText.length > 0 && data.options && data.options.length >= 2 && data.correctOptionIndex !== undefined;
    }
    if (data.questionType === 'Reading Comprehension') {
        return data.passage && data.passage.length > 0 && data.subQuestions && data.subQuestions.length > 0;
    }
    return false;
}, {
    message: "Missing required fields for the selected question type.",
    path: ["_form"],
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
        let questionPayload: any;

        if (questionData.questionType === 'Standard') {
             questionPayload = {
                questionType: 'Standard',
                questionText: questionData.questionText,
                options: questionData.options,
                correctOptionIndex: questionData.correctOptionIndex,
                subject: questionData.subject,
                topic: questionData.topic,
                difficulty: questionData.difficulty,
                explanation: questionData.explanation,
            };
        } else if (questionData.questionType === 'Reading Comprehension') {
            questionPayload = {
                questionType: 'Reading Comprehension',
                passage: questionData.passage,
                subQuestions: questionData.subQuestions,
                questionText: `Reading Comprehension: ${questionData.passage?.substring(0, 50)}...`, // Auto-generated summary
                subject: questionData.subject,
                topic: questionData.topic,
                difficulty: questionData.difficulty,
                explanation: questionData.explanation,
            };
        } else {
            throw new Error("Invalid question type");
        }


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
            
            // This is a temporary hack and should be defined in the mock data itself.
            const sections = [
                { id: 's1', name: 'Quantitative Aptitude', questionsCount: (examData as any).questions / 2 || 10, marksPerQuestion: 1 },
                { id: 's2', name: 'Reasoning Ability', questionsCount: (examData as any).questions / 2 || 10, marksPerQuestion: 1 },
            ];

            const examPayload = {
                ...examData,
                sections: sections,
                totalQuestions: (examData as any).questions,
                totalMarks: (examData as any).questions,
                durationMin: (examData as any).durationMin || 60,
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
                        questionType: 'Standard',
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
        // Ensure options are well-formed before returning
        const validatedData = {
            ...parsedData,
            options: parsedData.options?.map(opt => ({ text: opt.text || '' })) || [],
        };
        return { success: true, data: validatedData };
    } catch (error) {
        console.error("Error in parseQuestionAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during parsing.";
        return { success: false, error: errorMessage };
    }
}

    
