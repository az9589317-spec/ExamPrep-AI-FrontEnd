
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
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { allCategories } from '@/lib/categories.tsx';
import type { Exam, Question, UserProfile, ExamResult } from '@/lib/data-structures';

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
    const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    
    // Always sort by name in the code.
    examsData.sort((a, b) => a.name.localeCompare(b.name));

    return JSON.parse(JSON.stringify(examsData));
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

export async function getUsers(): Promise<UserProfile[]> {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    if (snapshot.empty) {
        return [];
    }
    const users = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().displayName,
        email: d.data().email,
        photoURL: d.data().photoURL,
        registrationDate: new Date(d.data().createdAt).toLocaleDateString(),
        status: 'active', // Assuming all users are active for now
    }))
    return JSON.parse(JSON.stringify(users));
}

export async function getUser(userId: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
        return null;
    }
    const data = userDoc.data();
    const userProfile: UserProfile = {
        id: userDoc.id,
        name: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        registrationDate: new Date(data.createdAt).toLocaleDateString(),
        status: 'active', // Assuming status is active
    };
    return JSON.parse(JSON.stringify(userProfile));
}


export async function saveExamResult(userId: string, resultData: Omit<ExamResult, 'id' | 'userId' | 'submittedAt'>): Promise<string> {
    const resultsCollection = collection(db, 'results');
    
    const examDoc = await getDoc(doc(db, 'exams', resultData.examId));
    if (!examDoc.exists()) {
        throw new Error("Exam not found, cannot save result.");
    }
    const exam = examDoc.data() as Exam;

    const resultToSave = {
        ...resultData,
        userId,
        submittedAt: new Date(),
        maxScore: exam.totalMarks,
    };
    const docRef = await addDoc(resultsCollection, resultToSave as any);
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
  const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult & {id: string, submittedAt: Timestamp}));

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
