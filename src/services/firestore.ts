
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
  QueryConstraint,
} from 'firebase/firestore';
import { allCategories } from '@/lib/categories.tsx';
import type { Exam, Question, UserProfile, ExamResult } from '@/lib/data-structures';
import { getQuestionsForExam as getQuestions } from './firestore';

export async function getPublishedExams(categories?: string[]): Promise<Exam[]> {
    const examsCollection = collection(db, 'exams');
    const queryConstraints: QueryConstraint[] = [where('status', '==', 'published')];

    if (categories && categories.length > 0) {
        // Firestore 'in' query is limited to 10 items. If more are needed, multiple queries would be required.
        // For this app's structure (1 or 2 categories), this is fine.
        queryConstraints.push(where('category', 'in', categories));
    }
    
    const q = query(examsCollection, ...queryConstraints);
    
    const snapshot = await getDocs(q);
    const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    
    // Always sort by name in the code.
    examsData.sort((a, b) => a.name.localeCompare(b.name));

    return JSON.parse(JSON.stringify(examsData));
}


export async function getExam(id: string): Promise<Exam | null> {
  if (id === 'custom') {
    // This is a special case for AI-generated exams that are not in Firestore.
    // The data is handled client-side in the exam page.
    // Returning a placeholder or null. The client should not call this for 'custom'.
    return null;
  }
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
    const q = query(examsCollection, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const exams = snapshot.docs.map(doc => doc.data() as Exam);

    const examCountByCategory: Record<string, any> = {};

    // Grouping by sub-category first
    exams.forEach(exam => {
        const subCategory = exam.category;
        examCountByCategory[subCategory] = (examCountByCategory[subCategory] || 0) + 1;
    });

    // Then, creating nested counts for main categories like "Banking" -> "Previous Year Paper"
    allCategories.forEach(mainCat => {
        if (mainCat.name !== 'Previous Year Paper' && mainCat.name !== 'Daily Quiz') {
            const papers = exams.filter(e => e.category === mainCat.name && e.examType === 'Previous Year Paper');
            if (papers.length > 0) {
                if (!examCountByCategory[mainCat.name]) {
                    examCountByCategory[mainCat.name] = {};
                }
                examCountByCategory[mainCat.name]['Previous Year Paper'] = papers.length;
            }
        }
    });

    const categories = allCategories.map(c => c.name);

    return { categories, examCountByCategory };
}

export async function saveExamResult(userId: string, resultData: Omit<ExamResult, 'id' | 'userId' | 'submittedAt'>): Promise<string> {
    if (resultData.examId === 'custom') {
        // Don't save results for custom-generated exams
        // We still need a unique ID for the results page URL
        return `custom-${new Date().getTime()}`;
    }

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
    if (resultId.startsWith('custom-')) {
        // For custom exams, the results are not stored in Firestore.
        // In a real application, you might temporarily store this in session/local storage
        // or a temporary database. For this demo, we'll return null and the page will show 'not found'.
        // A more robust solution would be needed for persistence.
        return null;
    }
    
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

export async function getUniqueSectionAndTopicNames() {
    const examsSnapshot = await getDocs(query(collection(db, 'exams'), where('status', '==', 'published')));
    const sections = new Set<string>();
    const topicsBySection: Record<string, Set<string>> = {};

    for (const examDoc of examsSnapshot.docs) {
        const questionsSnapshot = await getDocs(collection(db, 'exams', examDoc.id, 'questions'));
        questionsSnapshot.forEach(questionDoc => {
            const question = questionDoc.data() as Question;
            if (question.subject) {
                sections.add(question.subject);
                if (!topicsBySection[question.subject]) {
                    topicsBySection[question.subject] = new Set();
                }
                if (question.topic) {
                    topicsBySection[question.subject].add(question.topic);
                }
            }
        });
    }

    return {
        sections: Array.from(sections).sort(),
        topicsBySection: Object.fromEntries(
            Object.entries(topicsBySection).map(([section, topics]) => [section, Array.from(topics).sort()])
        )
    };
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
