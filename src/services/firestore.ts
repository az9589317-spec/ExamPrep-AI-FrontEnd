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
  serverTimestamp
} from 'firebase/firestore';
import { allCategories } from '@/lib/categories';

// Assuming a flat structure for simplicity. In a real app, you might structure this differently.
export interface Exam {
  id: string;
  mockId?: string;
  name: string;
  category: string;
  status: 'published' | 'draft';
  durationMin: number;
  cutoff: number;
  negativeMarkPerWrong: number;
  questions: number; // This will now represent the count of questions
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
    explanation?: string;
    examId?: string; // Not stored in subcollection docs, but useful when flattening
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    registrationDate: string; // Should be a Timestamp in a real app
    status: 'active' | 'suspended';
    photoURL?: string;
}

export async function getExams(category?: string): Promise<Exam[]> {
  const examsCollection = collection(db, 'exams');
  const q = category 
    ? query(examsCollection, where('category', '==', category), orderBy('createdAt', 'desc'))
    : query(examsCollection, orderBy('createdAt', 'desc'));
    
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
}

export async function getPublishedExams(category?: string): Promise<Exam[]> {
    const examsCollection = collection(db, 'exams');
    let q;
    if (category) {
        q = query(examsCollection, where('category', '==', category), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
    } else {
        q = query(examsCollection, where('status', '==', 'published'), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
}


export async function getExam(id: string): Promise<Exam | null> {
  const examDoc = await getDoc(doc(db, 'exams', id));
  if (!examDoc.exists()) {
    return null;
  }
  return { id: examDoc.id, ...examDoc.data() } as Exam;
}

export async function getQuestionsForExam(examId: string): Promise<Question[]> {
  const questionsCollection = collection(db, 'exams', examId, 'questions');
  const q = query(questionsCollection, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
}

export async function getExamCategories() {
    const examsCollection = collection(db, 'exams');
    const snapshot = await getDocs(examsCollection);
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
        { id: 'user-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', registrationDate: '2023-01-15', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-1/32/32` },
        { id: 'user-2', name: 'Diya Patel', email: 'diya.patel@example.com', registrationDate: '2023-02-20', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-2/32/32` },
        { id: 'user-3', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', registrationDate: '2023-03-10', status: 'suspended' as const, photoURL: `https://picsum.photos/seed/user-3/32/32` },
        { id: 'user-4', name: 'Priya Singh', email: 'priya.singh@example.com', registrationDate: '2023-04-05', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-4/32/32` },
        { id: 'user-5', name: 'Aditya Kumar', email: 'aditya.kumar@example.com', registrationDate: '2023-05-21', status: 'active' as const, photoURL: `https://picsum.photos/seed/user-5/32/32` },
    ];
}


export interface ExamResult {
  userId: string;
  examId: string;
  examName: string;
  score: number;
  timeTaken: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  answers: Record<number, number>;
  cutoff?: number;
  passed: boolean;
  submittedAt: any; // Firestore Timestamp
}

export async function saveExamResult(userId: string, resultData: Omit<ExamResult, 'userId' | 'submittedAt' | 'id'>): Promise<string> {
    const resultsCollection = collection(db, 'results');
    const resultToSave = {
        ...resultData,
        userId,
        submittedAt: serverTimestamp(),
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

    // Fetch the questions for the exam as well
    const questions = await getQuestionsForExam(resultData.examId);

    return {
        ...resultData,
        questions
    };
}
