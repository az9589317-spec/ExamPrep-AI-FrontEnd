
/**
 * @fileoverview This file defines the core data structures and TypeScript types used throughout the application.
 * It serves as the single source of truth for the shapes of data objects, such as Exams, Questions, Users, and Results.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Defines the configuration for a single section within an exam.
 * Admins can customize each section's rules and properties.
 */
export interface Section {
  id: string; // Unique identifier for the section (e.g., 'quant-aptitude')
  name: string; // Display name of the section (e.g., "Quantitative Aptitude")
  timeLimit?: number; // Optional time limit for this section in minutes.
  cutoffMarks?: number; // Optional minimum marks required to pass this section.
  negativeMarking: boolean; // Whether incorrect answers in this section have negative marks.
  negativeMarkValue?: number; // The value to deduct for an incorrect answer (e.g., 0.25).
  allowQuestionNavigation: boolean; // Can the user jump between questions within this section?
  randomizeQuestions: boolean; // Should the order of questions be randomized for each user?
  showCalculator: boolean; // Should a basic calculator be available for this section?
  instructions?: string; // Optional specific instructions to show at the start of the section.
}

/**
 * Represents the complete structure of an exam, configured by an admin.
 * This is the central model for all tests, quizzes, and papers on the platform.
 */
export interface Exam {
  id: string; // Unique identifier for the exam document in Firestore.
  name:string; // The official name of the exam (e.g., "SBI PO Prelims Mock 2").
  category: string; // The main category the exam belongs to (e.g., "Banking").
  subCategory: string[]; // An array of sub-categories for detailed filtering (e.g., ["SBI", "Previous Year Paper"]).
  year?: number; // Optional field, mainly used for "Previous Year Paper" sub-category.
  examType: 'Full Mock' | 'Sectional Mock' | 'Practice' | 'Custom'; // The type of the exam.
  status: 'published' | 'draft' | 'archived'; // The visibility status of the exam.
  
  sections: Section[]; // An array of section configurations that make up the exam.
  
  // These totals are automatically calculated and updated on the server.
  totalQuestions: number; // The total number of questions across all sections.
  totalMarks: number; // The total possible marks for the exam.
  
  // Global exam settings controlled by the admin.
  durationMin: number; // The total duration of the exam in minutes.
  hasOverallTimer: boolean; // Is there a single timer for the whole exam?
  hasSectionTimer: boolean; // Does each section have its own individual timer?
  allowBackNavigation: boolean; // Can users navigate back to previous sections?
  autoSubmit: boolean; // Does the exam automatically submit when the timer runs out?
  showResults: boolean; // Should the results be shown to the user immediately upon completion?
  allowReAttempt: boolean; // Can users attempt this exam more than once?
  maxAttempts?: number; // If re-attempts are allowed, this sets a limit.
  passingCriteria: 'overall' | 'sectional' | 'both'; // What determines if a user passes the exam?
  overallCutoff?: number; // The overall minimum marks required to pass.
  
  // Optional scheduling for the exam's availability.
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  
  // Security and proctoring settings.
  requireProctoring: boolean; // Is video/audio proctoring required?
  lockBrowser: boolean; // Does the exam require a secure browser environment?
  preventCopyPaste: boolean; // Disable copy and paste functionality during the exam.
  randomizeOptions: boolean; // Should the order of options for each question be randomized?
  showQuestionNumbers: boolean; // Display question numbers to the user.
  fullScreenMode: boolean; // Force the exam to be taken in full-screen mode.
  tabSwitchDetection: boolean; // Detect and log if the user switches browser tabs.
  
  // Configuration for the results view.
  showCorrectAnswers: boolean; // Show the correct answers in the results summary.
  showExplanations: boolean; // Show the detailed explanations for answers.
  allowResultDownload: boolean; // Can the user download their results as a PDF?
  
  // Metadata.
  createdBy?: string; // The UID of the admin who created the exam.
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  questions: number; // Legacy field for total question objects (distinct from total countable questions).
}


/**
 * Represents a single sub-question, typically used within a Reading Comprehension question.
 */
export interface SubQuestion {
    id: string; // Unique identifier for the sub-question.
    questionText: string;
    options: QuestionOption[];
    correctOptionIndex: number;
    explanation?: string;
    marks?: number; // Marks for this specific sub-question.
}

/**
 * Represents a single question within an exam. It supports multiple formats.
 */
export interface Question {
  id: string;
  questionType: 'Standard' | 'Reading Comprehension';
  
  // Common fields for all question types.
  subject: string; // The section this question belongs to (e.g., "Quantitative Aptitude").
  topic: string; // The specific topic of the question (e.g., "Time and Work").
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string; // Detailed explanation for the correct answer.
  examId: string; // The ID of the exam this question belongs to.
  marks: number; // The total marks for this question object. For RC, this is the sum of sub-question marks.
  
  // Fields specific to 'Standard' (MCQ) questions.
  questionText?: string;
  imageUrl?: string;
  options?: QuestionOption[];
  correctOptionIndex?: number;

  // Fields specific to 'Reading Comprehension' questions.
  passage?: string;
  subQuestions?: SubQuestion[];

  // Metadata.
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Represents a single answer option for a multiple-choice question.
 */
export interface QuestionOption {
  text: string;
}

/**
 * Represents a user's profile information stored in Firestore.
 */
export interface UserProfile {
    id: string; // Corresponds to Firebase Auth UID.
    name: string;
    email: string;
    photoURL?: string;
    registrationDate: string; // Formatted date string (e.g., "9/11/2025").
    status: 'active' | 'suspended'; // The status of the user account.
    role: 'user' | 'admin'; // User role for access control.
}

/**
 * Represents the result of a single exam attempt by a user.
 */
export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  examCategory: string;
  isDisqualified?: boolean; // Flag to exclude from leaderboards
  
  // Overall performance metrics.
  score: number;
  maxScore: number;
  timeTaken: number; // Total time in seconds.
  
  // Question-wise performance breakdown.
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number; // Percentage of correct answers out of attempted questions.
  
  // Denormalized data for easy review.
  answers: Record<string, any>; // Stores the user's answers for each question.
  questions: Question[]; // A snapshot of the questions at the time of the attempt.

  // Metadata.
  submittedAt: Timestamp;
}


/**
 * Represents a request from a user to gain admin access to the platform.
 */
export interface AdminRequest {
    id: string;
    userId: string;
    name: string;
    email: string;
    reason: string; // The justification provided by the user.
    status: 'pending' | 'approved' | 'rejected'; // The current status of the request.
    createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  isRead: boolean;
  link?: string;
  imageUrl?: string;
  type: 'broadcast' | 'alert';
}

/**
 * Re-exporting from categories to provide a single point of import for data structures.
 */
export interface SubCategory {
    name: string;
    icon?: React.ReactNode;
}
