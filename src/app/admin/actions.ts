

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
<<<<<<< HEAD
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDocs, query, setDoc, getCountFromServer, deleteDoc } from 'firebase/firestore';
=======
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDoc, query, where, getDocs, setDoc, runTransaction } from 'firebase/firestore';
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
import { revalidatePath } from 'next/cache';
import { exams as mockExams, questions as mockQuestions } from '@/lib/mock-data';
import { parseQuestionFromText } from '@/ai/flows/parse-question-from-text';
import { v4 as uuidv4 } from 'uuid';


const sectionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(2, "Section name must be at least 2 characters."),
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
<<<<<<< HEAD
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
=======
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().min(1, 'Duration is required'),
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
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
    const dataToSave: any = {
      ...examData,
<<<<<<< HEAD
      updatedAt: new Date(),
=======
      name: title,
      status: visibility,
      questions: 0,
      totalMarks: 0,
      createdAt: new Date(),
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
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
        // When updating, we don't change totalQuestions or totalMarks as they are derived from questions.
        // These fields should be updated via a separate function or trigger when questions are added/removed.
        await updateDoc(examRef, dataToSave);
    } else {
        const newExamRef = doc(collection(db, 'exams'));
        dataToSave.createdAt = new Date();
        dataToSave.totalQuestions = 0; // Starts with 0 questions.
        dataToSave.totalMarks = 0; // Starts with 0 marks.
        dataToSave.questions = 0; // Legacy field, keeping for compatibility
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

<<<<<<< HEAD
const subQuestionSchema = z.object({
    id: z.string().default(() => uuidv4()),
    questionText: z.string().min(1, "Sub-question text is required."),
    options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2),
    correctOptionIndex: z.coerce.number().min(0),
    explanation: z.string().optional(),
});

const addQuestionSchema = z.object({
  questionType: z.enum(['Standard']),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  examId: z.string(),
  questionId: z.string().optional(),
  marks: z.coerce.number().min(0.25, "Marks must be at least 0.25."),
  
  // Standard Question Fields
  questionText: z.string().optional(),
  options: z.array(z.object({ text: z.string() })).optional(),
  correctOptionIndex: z.coerce.number().optional(),

}).refine(data => {
    if (data.questionType === 'Standard') {
        return data.questionText && data.questionText.length > 0 && data.options && data.options.length >= 2 && data.correctOptionIndex !== undefined;
    }
    return false;
}, {
    message: "Missing required fields for the selected question type.",
    path: ["_form"],
=======
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
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
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
<<<<<<< HEAD
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
                marks: questionData.marks,
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

        // After adding/updating a question, update the totalQuestions and totalMarks on the exam doc
        const examRef = doc(db, 'exams', examId);
        const questionsCollectionRef = collection(db, 'exams', examId, 'questions');
        const questionsSnapshot = await getDocs(questionsCollectionRef);
        
        let totalMarks = 0;
        questionsSnapshot.forEach(qDoc => {
            totalMarks += qDoc.data().marks || 0;
        });

        const totalQuestions = questionsSnapshot.size;

        await updateDoc(examRef, {
            totalQuestions,
            totalMarks,
            questions: totalQuestions // for legacy compatibility
        });

=======
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
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
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


export async function deleteQuestionAction({ examId, questionId }: { examId: string, questionId: string }) {
    if (!examId || !questionId) {
        return { success: false, message: 'Invalid IDs provided.' };
    }

    try {
        const questionRef = doc(db, 'exams', examId, 'questions', questionId);
        await deleteDoc(questionRef);
        
        // After deleting, recalculate totalQuestions and totalMarks for the exam
        const examRef = doc(db, 'exams', examId);
        const questionsCollectionRef = collection(db, 'exams', examId, 'questions');
        const questionsSnapshot = await getDocs(questionsCollectionRef);

        let totalMarks = 0;
        questionsSnapshot.forEach(qDoc => {
            totalMarks += qDoc.data().marks || 0;
        });
        const totalQuestions = questionsSnapshot.size;

        await updateDoc(examRef, {
            totalQuestions,
            totalMarks,
            questions: totalQuestions // for legacy compatibility
        });

        revalidatePath(`/admin/exams/${examId}/questions`);
        return { success: true, message: 'Question deleted successfully.' };

    } catch (error) {
        console.error("Error deleting question:", error);
        return { success: false, message: 'Failed to delete question.' };
    }
}

export async function deleteExamAction({ examId }: { examId: string }) {
    if (!examId) {
        return { success: false, message: 'Invalid Exam ID provided.' };
    }

    try {
        const examRef = doc(db, 'exams', examId);
        const questionsCollectionRef = collection(db, 'exams', examId, 'questions');

        // Firestore does not support deleting subcollections directly from the client.
        // You must delete all documents within the subcollection first.
        const questionsSnapshot = await getDocs(questionsCollectionRef);
        const batch = writeBatch(db);
        questionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // After deleting all questions, delete the exam document itself.
        await deleteDoc(examRef);

        revalidatePath('/admin');
        return { success: true, message: 'Exam and all its questions deleted successfully.' };
    } catch (error) {
        console.error("Error deleting exam:", error);
        return { success: false, message: 'Failed to delete exam.' };
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
<<<<<<< HEAD
            const questionsToSeed = mockQuestions[mockExam.id] || [];
            
            const totalQuestions = questionsToSeed.length;
            const totalMarks = questionsToSeed.reduce((acc, q) => acc + (q.marks || 1), 0);

            const examPayload = {
                ...mockExam,
                sections: [
                    { id: 's1', name: 'Quantitative Aptitude', timeLimit: 30 },
                    { id: 's2', name: 'Reasoning Ability', timeLimit: 30 },
                ],
                totalQuestions: totalQuestions,
                totalMarks: totalMarks,
                durationMin: mockExam.durationMin || 60,
                questions: totalQuestions, // for legacy compatibility
=======
            const examData = { ...mockExam };
            
            // This property is on the mock data but not on the Exam model, so we remove it.
            delete (examData as any).questions; 
            
            const examPayload: any = {
                ...examData,
                questions: 0, // Will be calculated below
                totalMarks: 0, // Will be calculated below
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
                startTime: null,
                endTime: null,
                createdAt: new Date(),
            };
<<<<<<< HEAD

            // Remove fields that are no longer part of the core exam structure
            delete (examPayload as any).cutoff; 
            delete (examPayload as any).negativeMarkPerWrong;

            batch.set(examRef, examPayload);

=======
            
            let totalQuestions = 0;
            let totalMarks = 0;
            const questionsToSeed = mockQuestions[mockExam.id];
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
            if (questionsToSeed) {
                 totalQuestions = questionsToSeed.length;
                 for (const question of questionsToSeed) {
                    const questionRef = doc(db, 'exams', mockExam.id, 'questions', question.id);
                    const { id: qId, ...questionPayload } = question;
                    const marks = (question as any).marks || 1; // Default to 1 mark if not specified
                    totalMarks += marks;
                    batch.set(questionRef, {
                        ...questionPayload,
<<<<<<< HEAD
                        questionType: 'Standard',
                        marks: question.marks || 1,
=======
                        marks: marks,
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
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
<<<<<<< HEAD
        // Ensure options are well-formed before returning
        const validatedData = {
            ...parsedData,
            options: parsedData.options?.map(opt => ({ text: opt.text || '' })) || [],
        };
        return { success: true, data: validatedData };
=======
        // Add a default marks value if not parsed
        const dataWithMarks = {
            ...parsedData,
            marks: (parsedData as any).marks || 1,
        };
        return { success: true, data: dataWithMarks };
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
    } catch (error) {
        console.error("Error in parseQuestionAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during parsing.";
        return { success: false, error: errorMessage };
    }
}
