/**
 * @fileoverview This file defines the core data structures and TypeScript types used throughout the application.
 * It serves as the single source of truth for the shapes of data objects, such as Exams, Questions, Users, and Results.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a single section within an exam, such as "Quantitative Aptitude" or "Reasoning".
 */
export interface Section {
  name: string;
  questionsCount: number;
  marksPerQuestion: number;
}

/**
 * Represents a single exam. Exams are the main entities that users interact with.
 * They can be composed of multiple sections.
 */
export interface Exam {
  id: string;
  name: string;
  category: string;
  status: 'published' | 'draft';
  
  // Section-related fields
  sections: Section[];
  totalQuestions: number; // Automatically calculated from sections
  totalMarks: number; // Automatically calculated from sections
  
  // Exam-level settings
  durationMin: number;
  negativeMarkPerWrong: number;
  cutoff: number;
  
  // Scheduling
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  
  // Metadata
  createdAt: Timestamp;
}

/**
 * Represents a single question. Questions belong to an exam and are categorized by a subject,
 * which corresponds to one of the exam's section names.
 */
export interface Question {
  id: string;
  questionText: string;
  options: { text: string }[];
  correctOptionIndex: number;
  
  // Categorization
  subject: string; // This will match one of the Section names in the parent Exam
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Optional fields
  explanation?: string;
  
  // Relational ID (though questions are stored in a subcollection)
  examId: string; 

  // Metadata
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


/**
 * Represents a user's profile information.
 */
export interface UserProfile {
    id: string; // Corresponds to Firebase Auth UID
    name: string;
    email: string;
    photoURL?: string;
    registrationDate: Timestamp;
    status: 'active' | 'suspended';
}

/**
 * Represents the results of a user's attempt at an exam.
 */
export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  
  // Performance metrics
  score: number;
  timeTaken: number; // in seconds
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  
  // Data for review
  answers: Record<number, number>; // Maps question index to selected option index
  
  // Comparison metrics
  cutoff?: number;
  passed: boolean;
  
  // Metadata
  submittedAt: Timestamp;
}
