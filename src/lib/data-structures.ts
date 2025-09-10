

/**
 * @fileoverview This file defines the core data structures and TypeScript types used throughout the application.
 * It serves as the single source of truth for the shapes of data objects, such as Exams, Questions, Users, and Results.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Flexible section configuration - Admin can customize everything
 */
export interface Section {
  id: string; // Unique section identifier
  name: string; // Admin can set any section name
  timeLimit?: number; // Optional time limit per section (in minutes)
  cutoffMarks?: number; // Optional sectional cutoff
  negativeMarking: boolean; // Admin decides negative marking per section
  negativeMarkValue?: number; // Custom negative mark value per section
  allowQuestionNavigation: boolean; // Admin controls navigation within section
  randomizeQuestions: boolean; // Admin controls question randomization
  showCalculator: boolean; // Admin can enable calculator for specific sections
  instructions?: string; // Custom instructions for each section
}

/**
 * Completely flexible exam configuration by admin
 */
export interface Exam {
  id: string;
  name: string; // Admin defined exam name
  category: string; // Admin defined category
  examType: 'Prelims' | 'Mains' | 'Mock Test' | 'Practice' | 'Custom'; // Admin choice
  status: 'published' | 'draft' | 'archived';
  
  // Flexible section structure - Admin controls everything
  sections: Section[]; // Can be 1 to N sections
  totalQuestions: number; // Auto-calculated from sections
  totalMarks: number; // Auto-calculated from all question marks
  
  // Admin controlled exam settings
  durationMin: number; // Total exam duration
  hasOverallTimer: boolean; // Admin choice for overall timer
  hasSectionTimer: boolean; // Admin choice for section-wise timer
  allowBackNavigation: boolean; // Admin controls backward navigation
  autoSubmit: boolean; // Auto-submit when time ends
  showResults: boolean; // Show results immediately after exam
  allowReAttempt: boolean; // Admin allows re-attempts
  maxAttempts?: number; // Maximum attempts allowed
  passingCriteria: 'overall' | 'sectional' | 'both'; // Admin defined passing criteria
  overallCutoff?: number; // Optional overall cutoff marks
  
  // Scheduling (Admin controlled)
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  
  // Security and Proctoring (Admin controlled)
  requireProctoring: boolean;
  lockBrowser: boolean; // Secure browser mode
  preventCopyPaste: boolean;
  randomizeOptions: boolean; // Randomize answer options
  showQuestionNumbers: boolean;
  fullScreenMode: boolean;
  tabSwitchDetection: boolean;
  
  // Result and Analytics Settings
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowResultDownload: boolean; // Allow result PDF download
  
  // Metadata
  createdBy?: string; // Admin user ID
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  questions: number; // question count
}


/**
 * Represents a single sub-question, typically used within a Reading Comprehension question.
 */
export interface SubQuestion {
    id: string; // Unique identifier for the sub-question
    questionText: string;
    options: QuestionOption[];
    correctOptionIndex: number;
    explanation?: string;
}

/**
 * Enhanced Question Schema with complete flexibility for different formats.
 */
export interface Question {
  id: string;
  questionType: 'Standard' | 'Reading Comprehension';
  
  // Common fields for all types
  questionText?: string; // Optional for RC questions with only a passage
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  examId: string;
  marks: number; // Per-question marks
  estimatedTimeSec?: number; // Optional time per question
  
  // Type-specific fields
  // For 'Standard' questions
  options?: QuestionOption[];
  correctOptionIndex?: number;

  // For 'Reading Comprehension' questions
  passage?: string;
  subQuestions?: SubQuestion[];

  // Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}


/**
 * Standard multiple-choice option.
 */
export interface QuestionOption {
  text: string;
}

/**
 * Pair for "Match the Following" questions.
 */
export interface MatchPair {
    id: string;
    left: string;
    right: string;
}

/**
 * Media file structure for rich content
 */
export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'audio' | 'video' | 'document';
  size: number; // bytes
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

/**
 * Partial marking rules for complex questions
 */
export interface PartialMarkingRule {
  condition: string; // Description of condition
  marks: number; // Marks awarded for this condition
  percentage?: number; // Percentage of total marks
}


/**
 * Represents a user's profile information.
 */
export interface UserProfile {
    id: string; // Corresponds to Firebase Auth UID
    name: string;
    email: string;
    photoURL?: string;
    registrationDate: string;
    status: 'active' | 'suspended';
}


/**
 * Admin user profile with role-based permissions
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Exam Administrator' | 'Subject Expert' | 'Question Moderator' | 'Proctor';
  permissions: AdminPermission[];
  department?: string;
  photoURL?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Timestamp;
  createdAt: Timestamp;
}

/**
 * Detailed permission system for admins
 */
export interface AdminPermission {
  module: 'exams' | 'questions' | 'users' | 'results' | 'analytics' | 'settings';
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve' | 'publish')[];
}

/**
 * Enhanced exam result with detailed analytics
 */
export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  examName: string;
  examCategory: string;
  
  // Overall performance
  score: number;
  maxScore: number;
  timeTaken: number; // Total time in seconds
  
  // Question-wise performance
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  answers: Record<string, any>; // Flexible answers object
  questions: Question[]; // Denormalized questions for review

  // Metadata
  submittedAt: Timestamp;
}

/**
 * Individual question result
 */
export interface QuestionResult {
  questionId: string;
  selectedAnswers: number[]; // Multiple selections possible
  isCorrect: boolean;
  marksAwarded: number;
  timeSpent: number; // Time spent on this question
  reviewFlagged: boolean;
  attempts: number; // If question allows multiple attempts
}

/**
 * Section-wise result breakdown
 */
export interface SectionResult {
  sectionId: string;
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeTaken: number;
  qualified: boolean; // Based on sectional cutoff
}

/**
 * Admin configuration for exam templates
 */
export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSections: Section[];
  defaultSettings: Partial<Exam>;
  isPublic: boolean; // Can be used by other admins
  createdBy: string;
  usageCount: number;
  createdAt: Timestamp;
}

/**
 * System configuration controlled by admin
 */
export interface SystemConfig {
  id: string;
  allowGuestExams: boolean;
  defaultExamDuration: number;
  defaultNegativeMarking: number;
  maxFileUploadSize: number; // In MB
  supportedFileTypes: string[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  maxConcurrentUsers: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetentionDays: number;
  updatedBy: string;
  updatedAt: Timestamp;
}
