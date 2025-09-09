
// src/services/firestore.ts
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { allCategories } from '@/lib/categories.tsx';
<<<<<<< HEAD
import type { Exam, Question, UserProfile, ExamResult } from '@/lib/data-structures';
=======

// Assuming a flat structure for simplicity. In a real app, you might structure this differently.
export interface Exam {
  id: string;
  mockId?: string;
  name: string;
  category: string;
  status: 'published' | 'draft';
  durationMin: number;
  questions: number; // This will now represent the count of questions
  totalMarks: number; // Total marks for the exam
  createdAt: any; // Firestore Timestamp
  startTime?: any;
  endTime?: any;
}

export interface Question {
    id: string;
    questionText: string;
    options: { text: string }[];
    correctOptionIndex: number;
    subject: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    explanation?: string;
    examId?: string; // Not stored in subcollection docs, but useful when flattening
    type?: 'STANDARD' | 'RC_PASSAGE';
    parentQuestionId?: string;
    passage?: string; // For RC Passage type
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    registrationDate: string; // Should be a Timestamp in a real app
    status: 'active' | 'suspended';
    photoURL?: string;
}
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f

export async function getExams(category?: string): Promise<Exam[]> {
  const examsCollection = collection(db, 'exams');
  let q;
    if (category) {
        // Query only by category and sort in-memory to avoid composite index requirement.
        q = query(examsCollection, where('category', '==', category));
    } else {
        q = query(examsCollection, orderBy('name', 'asc'));
    }
    
  const snapshot = await getDocs(q);
  const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
  
  // Sort client-side if we couldn't do it in the query
  if (category) {
    exams.sort((a, b) => a.name.localeCompare(b.name));
  }
  return JSON.parse(JSON.stringify(exams));
}

export async function getPublishedExams(category?: string): Promise<Exam[]> {
    const examsCollection = collection(db, 'exams');
    let q;
    if (category) {
        q = query(examsCollection, where('status', '==', 'published'), where('category', '==', category));
    } else {
        // Query only by status, then sort in code to avoid needing a composite index.
        q = query(examsCollection, where('status', '==', 'published'));
    }
    
    const snapshot = await getDocs(q);
    const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc-data() } as Exam));
    
    // Always sort by name in the code.
    exams.sort((a, b) => a.name.localeCompare(b.name));

    return JSON.parse(JSON.stringify(exams));
}


export async function getExam(id: string): Promise<Exam | null> {
  const examDoc = await getDoc(doc(db, 'exams', id));
  if (!examDoc.exists()) {
    return null;
  }
  // Convert to plain object to avoid serialization errors
  return JSON.parse(JSON.stringify({ id: examDoc.id, ...examDoc.data() }));
}

export async function getQuestionsForExam(examId: string): Promise<Question[]> {
  const questionsCollection = collection(db, 'exams', examId, 'questions');
  const q = query(questionsCollection, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  return JSON.parse(JSON.stringify(questions));
}

export async function getExamCategories() {
    const examsCollection = collection(db, 'exams');
    // Query for published exams to calculate the counts
    const q = query(examsCollection, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const exams = snapshot.docs.map(doc => doc.data() as Exam);

    const examCountByCategory = exams.reduce((acc, exam) => {
        acc[exam.category] = (acc[exam.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // Return all predefined categories and the counts for those that have exams.
    const categories = allCategories.map(c => c.name);

    return { categories, examCountByCategory };
}

// In a real app, users would likely be stored in a separate top-level 'users' collection
// when they first sign up. For this demo, we'll continue using the mock data for users
// as we don't have a user creation flow beyond the admin login.
export async function getUsers(): Promise<UserProfile[]> {
    // This is a placeholder. In a real application, you would fetch from a 'users' collection.
    // e.g., const snapshot = await getDocs(collection(db, 'users'));
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserProfile }));
    
    // Returning mock users as we don't have a user registration flow
    return [
<<<<<<< HEAD
        { id: 'user-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', registrationDate: new Date('2023-01-15').toISOString(), status: 'active' as const, photoURL: `https://picsum.photos/seed/user-1/32/32` },
        { id: 'user-2', name: 'Diya Patel', email: 'diya.patel@example.com', registrationDate: new Date('2023-02-20').toISOString(), status: 'active' as const, photoURL: `https://picsum.photos/seed/user-2/32/32` },
        { id: 'user-3', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', registrationDate: new Date('2023-03-10').toISOString(), status: 'suspended' as const, photoURL: `https://picsum.photos/seed/user-3/32/32` },
        { id: 'user-4', name: 'Priya Singh', email: 'priya.singh@example.com', registrationDate: new Date('2023-04-05').toISOString(), status: 'active' as const, photoURL: `https://picsum.photos/seed/user-4/32/32` },
        { id: 'user-5', name: 'Aditya Kumar', email: 'aditya.kumar@example.com', registrationDate: new Date('2023-05-21').toISOString(), status: 'active' as const, photoURL: `https://picsum.photos/seed/user-5/32/32` },
    ].map(u => ({...u, registrationDate: new Date(u.registrationDate)})) as unknown as UserProfile[];
=======
        { id: 'user-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', registrationDate: '2023-01-15', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-1/32/32` },
        { id: 'user-2', name: 'Diya Patel', email: 'diya.patel@example.com', registrationDate: '2023-02-20', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-2/32/32` },
        { id: 'user-3', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', registrationDate: '2023-03-10', status: 'suspended' as const, photoURL: `https://picsum.photos/seed/user-3/32/32` },
        { id: 'user-4', name: 'Priya Singh', email: 'priya.singh@example.com', registrationDate: '2023-04-05', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-4/32/32` },
        { id: 'user-5', name: 'Aditya Kumar', email: 'aditya.kumar@example.com', registrationDate: '2023-05-21', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-5/32/32` },
    ];
}


export interface ExamResult {
  id?: string; // Add id field
  userId: string;
  examId: string;
  examName: string;
  score: number;
  maxScore: number;
  timeTaken: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  answers: Record<number, number>;
  submittedAt: any; // Firestore Timestamp
  questions: Question[]; // Denormalize questions for easier analysis
  examCategory: string; // Denormalize for analysis
>>>>>>> be7138f12367fdf963d9d3b2fdf3b765c360f10f
}

export async function saveExamResult(userId: string, resultData: Omit<ExamResult, 'userId' | 'submittedAt' | 'id'>): Promise<string> {
    const resultsCollection = collection(db, 'results');
    const resultToSave = {
        ...resultData,
        userId,
        submittedAt: new Date(),
    };
    const docRef = await addDoc(resultsCollection, resultToSave);
    return docRef.id;
}


export async function getExamResult(resultId: string): Promise<(ExamResult & {id: string, questions: Question[]}) | null> {
    const resultDoc = await getDoc(doc(db, 'results', resultId));
    if (!resultDoc.exists()) {
        return null;
    }
    const resultData = { id: resultDoc.id, ...resultDoc.data() } as ExamResult & {id: string};

    // Questions are now denormalized, but if not, fetch them.
    if (!resultData.questions) {
        (resultData as any).questions = await getQuestionsForExam(resultData.examId);
    }
    
    return JSON.parse(JSON.stringify(resultData));
}


export async function getResultsForUser(userId: string): Promise<(ExamResult & {id: string})[]> {
  const resultsCollection = collection(db, 'results');
  // Query only by userId to avoid needing a composite index.
  const q = query(resultsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult & {id: string}));

  // Sort the results by submission date in the code.
  results.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
  
  return JSON.parse(JSON.stringify(results));
}

export async function getCategoryPerformanceStats(category: string) {
    const resultsCollection = collection(db, 'results');
    const q = query(resultsCollection, where('examCategory', '==', category));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return {
            averageScore: 0,
            highestScore: 0,
            highestScoreExamName: 'N/A',
        };
    }

    const results = snapshot.docs.map(doc => doc.data() as ExamResult);
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const averageScore = totalScore / results.length;

    const highestScoreResult = results.reduce((max, r) => r.score > max.score ? r : max, results[0]);

    return {
        averageScore: parseFloat(averageScore.toFixed(2)),
        highestScore: parseFloat(highestScoreResult.score.toFixed(2)),
        highestScoreExamName: highestScoreResult.examName,
    };
}
