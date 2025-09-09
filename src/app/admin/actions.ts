

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDoc, query, where, getDocs, setDoc, runTransaction } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { exams as mockExams, questions as mockQuestions } from '@/lib/mock-data';
import { parseQuestionFromText } from '@/ai/flows/parse-question-from-text';

const addExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
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
      totalMarks: 0,
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

const optionSchema = z.object({ text: z.string().min(1, "Option text cannot be empty.") });

const standardQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  marks: z.coerce.number().min(0, "Marks must be a positive number."),
  options: z.array(optionSchema).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  explanation: z.string().optional(),
});

const rcQuestionSchema = z.object({
    passage: z.string().min(50, "Passage must be at least 50 characters long."),
    childQuestions: z.array(standardQuestionSchema).min(1, "At least one child question is required for a passage."),
});

const addQuestionSchema = z.object({
  questionType: z.enum(['STANDARD', 'RC_PASSAGE']),
  examId: z.string(),
  questionId: z.string().optional(), // For editing parent RC question
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  standard: standardQuestionSchema.optional(),
  rc: rcQuestionSchema.optional(),
}).refine(data => {
    if (data.questionType === 'STANDARD') return !!data.standard;
    if (data.questionType === 'RC_PASSAGE') return !!data.rc;
    return false;
}, {
    message: "Question data is missing for the selected type.",
    path: ['standard'] // or 'rc'
});


export async function addQuestionAction(data: z.infer<typeof addQuestionSchema>) {
    const validatedFields = addQuestionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { examId, questionId, questionType, subject, topic, difficulty, standard, rc } = validatedFields.data;

    try {
        await runTransaction(db, async (transaction) => {
            const examRef = doc(db, 'exams', examId);
            const examDoc = await transaction.get(examRef);

            if (!examDoc.exists()) {
                throw new Error("Exam not found!");
            }

            const currentQuestionCount = examDoc.data().questions || 0;
            const currentTotalMarks = examDoc.data().totalMarks || 0;
            let questionsChange = 0;
            let marksChange = 0;

            if (questionType === 'STANDARD' && standard) {
                const questionPayload: any = {
                    ...standard,
                    subject,
                    topic,
                    difficulty,
                    type: 'STANDARD',
                };

                if (questionId) { // Editing
                    const questionRef = doc(db, 'exams', examId, 'questions', questionId);
                    const oldQuestionDoc = await transaction.get(questionRef);
                    if (!oldQuestionDoc.exists()) {
                        throw new Error("Question to edit not found!");
                    }
                    const oldMarks = oldQuestionDoc.data().marks || 0;
                    marksChange = standard.marks - oldMarks;
                    questionsChange = 0; // No change in count on edit

                    questionPayload.updatedAt = new Date();
                    transaction.update(questionRef, questionPayload);
                } else { // Adding
                    marksChange = standard.marks;
                    questionsChange = 1;
                    
                    questionPayload.createdAt = new Date();
                    const newQuestionRef = doc(collection(db, 'exams', examId, 'questions'));
                    transaction.set(newQuestionRef, questionPayload);
                }
            } else if (questionType === 'RC_PASSAGE' && rc && !questionId) {
                // NOTE: Editing RC passages and their children is complex and not fully supported here.
                // This logic primarily handles adding new RC passages.
                const parentQuestionRef = doc(collection(db, 'exams', examId, 'questions'));
                const parentPayload = {
                    passage: rc.passage,
                    subject,
                    topic,
                    difficulty,
                    type: 'RC_PASSAGE',
                    createdAt: new Date(),
                };
                transaction.set(parentQuestionRef, parentPayload);

                for (const child of rc.childQuestions) {
                    const childQuestionRef = doc(collection(db, 'exams', examId, 'questions'));
                    const childPayload = {
                        ...child,
                        parentQuestionId: parentQuestionRef.id,
                        subject,
                        topic,
                        difficulty,
                        type: 'STANDARD', // Child questions are standard
                        createdAt: new Date(),
                    };
                    transaction.set(childQuestionRef, childPayload);
                    questionsChange++;
                    marksChange += child.marks;
                }
            }

            // Update the aggregate values on the exam document
            transaction.update(examRef, { 
                questions: currentQuestionCount + questionsChange,
                totalMarks: currentTotalMarks + marksChange,
            });
        });

        const examDoc = await getDoc(doc(db, 'exams', examId));
        revalidatePath(`/admin/exams/${examId}/questions`);
        if (examDoc.exists()) {
            revalidatePath(`/admin/category/${examDoc.data().category}`);
        }

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

        // Clear existing data first
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        for(const examDoc of examsSnapshot.docs) {
            const questionsSnapshot = await getDocs(collection(db, 'exams', examDoc.id, 'questions'));
            for (const questionDoc of questionsSnapshot.docs) {
                batch.delete(questionDoc.ref);
            }
            batch.delete(examDoc.ref);
        }
        
        for (const mockExam of mockExams) {
            const examRef = doc(db, 'exams', mockExam.id);
            const examData = { ...mockExam };
            
            // This property is on the mock data but not on the Exam model, so we remove it.
            delete (examData as any).questions; 
            
            const examPayload: any = {
                ...examData,
                questions: 0, // Will be calculated below
                totalMarks: 0, // Will be calculated below
                startTime: null,
                endTime: null,
                createdAt: new Date(),
            };
            
            let totalQuestions = 0;
            let totalMarks = 0;
            const questionsToSeed = mockQuestions[mockExam.id];
            if (questionsToSeed) {
                 totalQuestions = questionsToSeed.length;
                 for (const question of questionsToSeed) {
                    const questionRef = doc(db, 'exams', mockExam.id, 'questions', question.id);
                    const { id: qId, ...questionPayload } = question;
                    const marks = (question as any).marks || 1; // Default to 1 mark if not specified
                    totalMarks += marks;
                    batch.set(questionRef, {
                        ...questionPayload,
                        marks: marks,
                        createdAt: new Date()
                    });
                }
            }

            examPayload.questions = totalQuestions;
            examPayload.totalMarks = totalMarks;

            batch.set(examRef, examPayload);
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
        // Add a default marks value if not parsed
        const dataWithMarks = {
            ...parsedData,
            marks: (parsedData as any).marks || 1,
        };
        return { success: true, data: dataWithMarks };
    } catch (error) {
        console.error("Error in parseQuestionAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during parsing.";
        return { success: false, error: errorMessage };
    }
}
