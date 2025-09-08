

'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type Timestamp, writeBatch, getDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
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

const optionSchema = z.object({ text: z.string().min(1, "Option text cannot be empty.") });

const standardQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
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
      const examRef = doc(db, 'exams', examId);
      const batch = writeBatch(db);
      
      const examDoc = await getDoc(examRef);
      if (!examDoc.exists()) {
          throw new Error("Exam not found!");
      }
      const currentQuestionCount = examDoc.data().questions || 0;
      let questionsAdded = 0;


      if (questionType === 'STANDARD' && standard) {
        const { questionText, ...restOfStandard } = standard;
        const questionPayload: any = {
          ...restOfStandard,
          questionText,
          subject,
          topic,
          difficulty,
          type: 'STANDARD',
        };
        
        if (questionId) { // Editing a standard question
            questionPayload.updatedAt = new Date();
            const questionRef = doc(db, 'exams', examId, 'questions', questionId);
            batch.update(questionRef, questionPayload);
            // Question count doesn't change on edit
        } else { // Adding a new standard question
            questionPayload.createdAt = new Date();
            const newQuestionRef = doc(collection(db, 'exams', examId, 'questions'));
            batch.set(newQuestionRef, questionPayload);
            questionsAdded = 1;
        }
      } else if (questionType === 'RC_PASSAGE' && rc) {
        const parentQuestionRef = questionId ? doc(db, 'exams', examId, 'questions', questionId) : doc(collection(db, 'exams', examId, 'questions'));

        const parentPayload = {
            passage: rc.passage,
            subject,
            topic,
            difficulty,
            type: 'RC_PASSAGE',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (questionId) {
          batch.update(parentQuestionRef, parentPayload);
        } else {
          batch.set(parentQuestionRef, parentPayload);
          // RC Passage itself does not count as a scorable question.
          
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
              batch.set(childQuestionRef, childPayload);
              questionsAdded++;
          }
        }
      }

      // Update the question count on the exam document if questions were added
      if (questionsAdded > 0) {
          batch.update(examRef, { questions: currentQuestionCount + questionsAdded });
      }

        await batch.commit();
        revalidatePath(`/admin/exams/${examId}/questions`);
        revalidatePath(`/admin/category/${examDoc.data().category}`);


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
