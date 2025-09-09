/**
 * @fileoverview This file defines the core data structures and TypeScript types used throughout the application.
 * It serves as the single source of truth for the shapes of data objects, such as Exams, Questions, Users, and Results.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Standard competitive exam section configuration
 */
export interface Section {
  name: 'Reasoning Ability' | 'Quantitative Aptitude' | 'English Language' | 'General Awareness';
  questionsCount: 25; // Fixed for all sections
  marksPerQuestion: 1; // Standard 1 mark per question
  timeLimit: number; // In minutes (20-25 per section)
  cutoffMarks?: number; // Minimum marks required in this section
}

/**
 * Updated exam interface matching real competitive exams
 */
export interface Exam {
  id: string;
  name: string;
  category: 'Banking' | 'SSC' | 'Railway' | 'Insurance' | 'Other';
  examType: 'Prelims' | 'Mains'; // Most competitive exams have these stages
  status: 'published' | 'draft';
  
  // Fixed structure for competitive exams
  sections: Section[]; // Always 4 sections
  totalQuestions: 100; // Fixed total
  totalMarks: 100; // Fixed total
  
  // Real exam settings
  durationMin: number; // Total exam duration (80-100 minutes)
  negativeMarkPerWrong: 0.25; // Standard negative marking
  overallCutoff: number; // Overall passing marks
  hasSectionalCutoff: boolean;
  
  // Scheduling
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  
  // Metadata
  createdAt: Timestamp;
}

/**
 * Enhanced question interface with difficulty levels
 */
export interface Question {
  id: string;
  questionText: string;
  options: { text: string; isCorrect?: boolean }[]; // 4 options standard
  correctOptionIndex: number;
  
  // Enhanced categorization matching real exams
  section: 'Reasoning Ability' | 'Quantitative Aptitude' | 'English Language' | 'General Awareness';
  topic: string; // Specific topics within each section
  subtopic?: string; // Further classification
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Real exam features
  timeToSolve?: number; // Expected time in seconds
  explanation?: string;
  tags?: string[]; // For better categorization
  
  examId: string;
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
 * Enhanced exam result with sectional analysis
 */
export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  
  // Overall performance
  totalScore: number; // Out of 100
  totalTimeTaken: number; // in seconds
  totalQuestions: 100;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  accuracy: number; // Percentage
  
  // Sectional performance analysis
  sectionWiseResults: {
    sectionName: string;
    questionsCount: 25;
    attempted: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    score: number; // Including negative marking
    accuracy: number;
    timeTaken: number;
    cutoffMarks?: number;
    qualified: boolean; // If sectional cutoff exists
  }[];
  
  // Answer mapping (question index to selected option)
  answers: Record<number, number>;
  
  // Performance indicators
  overallCutoff: number;
  overallQualified: boolean;
  rank?: number; // Among all test takers
  percentile?: number;
  
  // Metadata
  submittedAt: Timestamp;
}

/**
 * Analytics and comparison data
 */
export interface ExamAnalytics {
  examId: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  averageTime: number;
  sectionWiseAverage: Record<string, number>;
  difficultyWisePerformance: Record<string, number>;
}
