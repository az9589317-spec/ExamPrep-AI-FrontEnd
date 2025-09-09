
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
  questionsCount: number; // Admin controls number of questions
  marksPerQuestion: number; // Admin sets marks per question
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
  totalMarks: number; // Auto-calculated from sections
  
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
  
  // Scheduling (Admin controlled)
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  registrationStartTime?: Timestamp;
  registrationEndTime?: Timestamp;
  
  // Security and Proctoring (Admin controlled)
  requireProctoring: boolean;
  lockBrowser: boolean; // Secure browser mode
  preventCopyPaste: boolean;
  randomizeOptions: boolean; // Randomize answer options
  showQuestionNumbers: boolean;
  
  // Result and Analytics Settings
  showCorrectAnswers: boolean; // Show correct answers after exam
  showExplanations: boolean; // Show explanations after exam
  allowResultDownload: boolean; // Allow result PDF download
  
  // Metadata
  createdBy?: string; // Admin user ID
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  questions: number; // question count
  cutoff?: number;
  negativeMarkPerWrong?: number;
}


/**
 * Enhanced Question Schema with complete flexibility
 */
export interface Question {
  id: string;
  questionText: string;
  questionType: 'MCQ' | 'Multiple Select' | 'True/False' | 'Fill in Blank' | 'Essay' | 'Numerical' | 'Matching';
  options: QuestionOption[];
  correctAnswers: number[]; // Support multiple correct answers
  
  // Categorization
  sectionId: string;
  section: string; // Section name for display
  subject: string;
  topic: string;
  subtopic?: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsTaxonomy?: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  
  // Scoring
  marks: number;
  negativeMarks: number;
  partialMarking: boolean;
  partialMarkingRules?: PartialMarkingRule[];
  
  // Time and Navigation
  timeLimit?: number; // seconds
  mandatory: boolean;
  allowReview: boolean;
  
  // Rich Content
  questionImage?: MediaFile;
  questionAudio?: MediaFile;
  questionVideo?: MediaFile;
  questionDocument?: MediaFile;
  
  // Help and Explanation
  explanation?: string;
  explanationImage?: MediaFile;
  explanationVideo?: MediaFile;
  hints?: string[];
  formula?: string; // LaTeX formula if applicable
  
  // Question Bank Integration
  questionBankId?: string;
  isFromBank: boolean;
  
  // Admin Controls
  tags: string[];
  keywords: string[];
  language: 'English' | 'Hindi' | 'Regional';
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'archived';
  rejectionReason?: string;
  version: number;
  
  // Analytics
  usageCount: number;
  difficultyScore?: number; // Based on student performance
  averageTimeToSolve?: number;
  successRate?: number;
  discriminationIndex?: number; // How well it differentiates students
  
  // Metadata
  examId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  correctOptionIndex: number;
}

/**
 * Enhanced Question Options with rich content support
 */
export interface QuestionOption {
  id: string;
  text: string;
  image?: MediaFile;
  isCorrect: boolean;
  explanation?: string;
  marks?: number; // For partial marking
  order: number; // Display order
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
    registrationDate: Timestamp;
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
  attemptNumber: number; // For multiple attempts
  
  // Overall performance
  totalScore: number;
  maxMarks: number;
  percentage: number;
  grade?: string; // Admin defined grading
  totalTimeTaken: number; // Total time in seconds
  
  // Question-wise performance
  questionResults: QuestionResult[];
  
  // Section-wise performance
  sectionResults: SectionResult[];
  
  // Detailed analysis
  timeDistribution: Record<string, number>; // Time spent per section/question
  answeredInSequence: boolean; // Did user follow sequence
  flaggedQuestions: number[]; // Questions marked for review
  
  // Comparison and ranking
  rank?: number;
  percentile?: number;
  averageScore?: number; // Overall average for comparison
  
  // Pass/Fail status
  overallResult: 'Pass' | 'Fail';
  sectionWiseResults: Record<string, 'Pass' | 'Fail'>;
  
  // Exam metadata
  startedAt: Timestamp;
  submittedAt: Timestamp;
  autoSubmitted: boolean; // Was it auto-submitted due to time
  answers: Record<number, number>;
  score: number;
  timeTaken: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  cutoff?: number;
  passed: boolean;
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
