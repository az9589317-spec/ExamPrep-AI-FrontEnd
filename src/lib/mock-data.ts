
// In a real app, this data would come from a database like Firestore.
export const exams = [
    { 
      id: 'sbi-po-prelims-mock-2', 
      name: 'SBI PO Prelims Mock 2', 
      category: 'Banking', 
      subCategory: ['SBI', 'Full Mock'],
      status: 'published' as const, 
      totalQuestions: 20,
      totalMarks: 20,
      durationMin: 15,
      cutoff: 12.5,
      negativeMarkPerWrong: 0.25,
    },
    { 
      id: 'ibps-po-mains-mock-1', 
      name: 'IBPS PO Mains Mock 1', 
      category: 'Banking', 
      subCategory: ['IBPS', 'Full Mock'],
      status: 'draft' as const, 
      totalQuestions: 155,
      totalMarks: 200,
      durationMin: 180,
      cutoff: 71.25,
      negativeMarkPerWrong: 0.25,
    },
    { 
      id: 'rbi-assistant-prelims-pyq-2022', 
      name: 'RBI Assistant Prelims 2022', 
      category: 'Banking',
      subCategory: ['RBI', 'Previous Year Paper'],
      status: 'published' as const, 
      totalQuestions: 100,
      totalMarks: 100,
      durationMin: 60,
      cutoff: 88.00,
      negativeMarkPerWrong: 0.25,
    },
    { 
        id: 'daily-quiz-quant-21-jul', 
        name: 'Daily Quiz - Quant (21 July)', 
        category: 'Daily Quiz', 
        subCategory: ['Quantitative Aptitude'],
        status: 'published' as const, 
        totalQuestions: 10,
        totalMarks: 10,
        durationMin: 15,
        cutoff: 7.00,
        negativeMarkPerWrong: 0,
    },
    {
      id: 'ssc-cgl-tier1-mock-1',
      name: 'SSC CGL Tier 1 Mock 1',
      category: 'SSC',
      subCategory: ['SSC CGL', 'Full Mock'],
      status: 'published' as const,
      totalQuestions: 100,
      totalMarks: 200,
      durationMin: 60,
      cutoff: 145.50,
      negativeMarkPerWrong: 0.50,
    },
    {
      id: 'ssc-chsl-tier1-pyq-2023',
      name: 'SSC CHSL Tier 1 2023 Paper',
      category: 'SSC',
      subCategory: ['SSC CHSL', 'Previous Year Paper'],
      status: 'published' as const,
      totalQuestions: 100,
      totalMarks: 200,
      durationMin: 60,
      cutoff: 151.00,
      negativeMarkPerWrong: 0.50,
    },
    {
      id: 'railway-ntpc-stage1-mock-3',
      name: 'Railway NTPC Stage 1 Mock 3',
      category: 'Railway',
      subCategory: ['NTPC', 'Full Mock'],
      status: 'published' as const,
      totalQuestions: 100,
      totalMarks: 100,
      durationMin: 90,
      cutoff: 78.00,
      negativeMarkPerWrong: 1/3,
    },
    {
        id: 'railway-groupd-mock-5',
        name: 'Railway Group D Mock 5',
        category: 'Railway',
        subCategory: ['Group D', 'Full Mock'],
        status: 'draft' as const,
        totalQuestions: 100,
        totalMarks: 100,
        durationMin: 90,
        cutoff: 72.00,
        negativeMarkPerWrong: 1/3,
    },
    {
        id: 'upsc-csat-prelims-mock-1',
        name: 'UPSC CSAT Prelims Mock 1',
        category: 'UPSC',
        subCategory: ['Civil Services', 'Full Mock'],
        status: 'published' as const,
        totalQuestions: 80,
        totalMarks: 200,
        durationMin: 120,
        cutoff: 66.67,
        negativeMarkPerWrong: 0.83,
    },
    {
        id: 'jee-main-physics-mock-1',
        name: 'JEE Main Physics Mock 1',
        category: 'JEE',
        subCategory: ['JEE Main', 'Sectional Mock'],
        status: 'published' as const,
        totalQuestions: 30,
        totalMarks: 100,
        durationMin: 60,
        cutoff: 45,
        negativeMarkPerWrong: 1,
    },
    {
        id: 'neet-biology-mock-2',
        name: 'NEET Biology Mock 2',
        category: 'NEET',
        subCategory: ['NEET UG', 'Sectional Mock'],
        status: 'published' as const,
        totalQuestions: 90,
        totalMarks: 360,
        durationMin: 90,
        cutoff: 280,
        negativeMarkPerWrong: 1,
    },
    {
        id: 'cat-quant-mock-1',
        name: 'CAT Quant Mock 1',
        category: 'CAT',
        subCategory: ['CAT', 'Sectional Mock'],
        status: 'published' as const,
        totalQuestions: 22,
        totalMarks: 66,
        durationMin: 40,
        cutoff: 35,
        negativeMarkPerWrong: 1,
    },
    {
        id: 'clat-legal-reasoning-mock-1',
        name: 'CLAT Legal Reasoning Mock 1',
        category: 'CLAT',
        subCategory: ['CLAT', 'Sectional Mock'],
        status: 'published' as const,
        totalQuestions: 35,
        totalMarks: 35,
        durationMin: 35,
        cutoff: 25,
        negativeMarkPerWrong: 0.25,
    }
  ];
  
export type Exam = typeof exams[0];

export const questions: Record<string, any[]> = {
  'sbi-po-prelims-mock-2': [
    { id: 'q1', questionText: 'If a train 110 meters long passes a telegraph pole in 3 seconds, then the time taken by it to cross a railway platform 165 meters long is:', subject: 'Quantitative Aptitude', topic: 'Time, Speed & Distance', difficulty: 'easy' as const, options: [{text: '9 seconds'}, {text: '10 seconds'}, {text: '7.5 seconds'}, {text: '12.5 seconds'}], correctOptionIndex: 2, marks: 1, explanation: 'Speed of the train = Length of train / Time taken to pass the pole = 110/3 m/s. Time to cross the platform = (Length of train + Length of platform) / Speed = (110 + 165) / (110/3) = 275 * 3 / 110 = 7.5 seconds.', explanationImageUrl: 'https://iili.io/KT9f69s.png' },
    { id: 'q2', questionText: 'The sum of the ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?', subject: 'Quantitative Aptitude', topic: 'Ages', difficulty: 'easy' as const, options: [{text: '4 years'}, {text: '8 years'}, {text: '10 years'}, {text: 'None of these'}], correctOptionIndex: 0, marks: 1 },
    { id: 'q3', questionText: 'A can do a piece of work in 4 hours; B and C together can do it in 3 hours, while A and C together can do it in 2 hours. How long will B alone take to do it?', subject: 'Quantitative Aptitude', topic: 'Time and Work', difficulty: 'medium' as const, options: [{text: '10 hours'}, {text: '12 hours'}, {text: '8 hours'}, {text: '24 hours'}], correctOptionIndex: 1, marks: 1 },
    { id: 'q4', questionText: 'Find the correctly spelt word.', subject: 'English Language', topic: 'Spelling', difficulty: 'easy' as const, options: [{text: 'Accomodate'}, {text: 'Acommodate'}, {text: 'Accommodate'}, {text: 'Acomodate'}], correctOptionIndex: 2, marks: 1 },
    { id: 'q5', questionText: 'In the following question, out of the four alternatives, select the alternative which best expresses the meaning of the idiom/phrase: "To be in a tight corner".', imageUrl: 'https://iili.io/KT9doU7.jpg', subject: 'English Language', topic: 'Idioms and Phrases', difficulty: 'medium' as const, options: [{text: 'In a closed room'}, {text: 'In a small field'}, {text: 'In a difficult situation'}, {text: 'In a meadow'}], correctOptionIndex: 2, marks: 1 },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `q${i + 6}`,
      questionText: `This is placeholder question number ${i + 6}. What is the correct option?`,
      subject: 'Placeholder',
      topic: 'Placeholder Topic',
      difficulty: 'easy' as const,
      options: [{text: 'Option A'}, {text: 'Option B'}, {text: 'Option C'}, {text: 'Option D'}],
      correctOptionIndex: 0,
      marks: 1,
      explanation: `This is a placeholder explanation for question ${i + 6}.`
    })),
  ],
  'rbi-assistant-prelims-pyq-2022': [
    ...Array.from({ length: 100 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Mixed', topic: 'PYQ', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 1}))
  ],
  'daily-quiz-quant-21-jul': [
    ...Array.from({ length: 10 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Quantitative Aptitude', topic: 'Daily Quiz', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 1}))
  ],
  'ssc-cgl-tier1-mock-1': [
    ...Array.from({ length: 100 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Mixed', topic: 'SSC CGL', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 2}))
  ],
  'ssc-chsl-tier1-pyq-2023': [
    ...Array.from({ length: 100 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Mixed', topic: 'SSC CHSL', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 2}))
  ],
  'railway-ntpc-stage1-mock-3': [
    ...Array.from({ length: 100 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Mixed', topic: 'NTPC', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 1}))
  ],
  'upsc-csat-prelims-mock-1': [
    ...Array.from({ length: 80 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'General Studies', topic: 'UPSC CSAT', difficulty: 'hard' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 2.5}))
  ],
  'jee-main-physics-mock-1': [
      ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Physics', topic: 'JEE Main', difficulty: 'hard' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: i < 20 ? 4 : 0})) // Example for different marks
  ],
  'neet-biology-mock-2': [
      ...Array.from({ length: 90 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Biology', topic: 'NEET UG', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 4}))
  ],
  'cat-quant-mock-1': [
      ...Array.from({ length: 22 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Quantitative Ability', topic: 'CAT', difficulty: 'hard' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 3}))
  ],
  'clat-legal-reasoning-mock-1': [
      ...Array.from({ length: 35 }, (_, i) => ({ id: `q${i+1}`, questionText: `Placeholder question ${i+1}`, subject: 'Legal Reasoning', topic: 'CLAT', difficulty: 'medium' as const, options: [{text: 'A'}, {text:'B'}, {text:'C'}, {text:'D'}], correctOptionIndex: 0, marks: 1}))
  ],
};

export const users = [
    { id: 'user-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', registrationDate: '2023-01-15', status: 'active' as const },
    { id: 'user-2', name: 'Diya Patel', email: 'diya.patel@example.com', registrationDate: '2023-02-20', status: 'active' as const },
    { id: 'user-3', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', registrationDate: '2023-03-10', status: 'suspended' as const },
    { id: 'user-4', name: 'Priya Singh', email: 'priya.singh@example.com', registrationDate: '2023-04-05', status: 'active' as const },
    { id: 'user-5', name: 'Aditya Kumar', email: 'aditya.kumar@example.com', registrationDate: '2023-05-21', status: 'active' as const },
    { id: 'user-6', name: 'Ananya Reddy', email: 'ananya.reddy@example.com', registrationDate: '2023-06-12', status: 'active' as const },
    { id: 'user-7', name: 'Vikram Iyer', email: 'vikram.iyer@example.com', registrationDate: '2023-07-01', status: 'suspended' as const },
];
