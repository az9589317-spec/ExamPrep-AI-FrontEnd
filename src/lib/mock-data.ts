// In a real app, this data would come from a database like Firestore.
export const exams = [
    { 
      id: 'sbi-po-prelims-mock-2', 
      name: 'SBI PO Prelims Mock 2', 
      category: 'Bank PO', 
      status: 'published' as const, 
      questions: 100,
      durationMin: 60,
    },
    { 
      id: 'ibps-po-mains-mock-1', 
      name: 'IBPS PO Mains Mock 1', 
      category: 'Bank PO', 
      status: 'draft' as const, 
      questions: 155,
      durationMin: 180,
    },
    { 
      id: 'rbi-assistant-prelims-pyq-2022', 
      name: 'RBI Assistant Prelims 2022', 
      category: 'Previous Year Paper', 
      status: 'published' as const, 
      questions: 100,
      durationMin: 60,
    },
    { 
        id: 'daily-quiz-quant-21-jul', 
        name: 'Daily Quiz - Quant (21 July)', 
        category: 'Daily Quiz', 
        status: 'published' as const, 
        questions: 10,
        durationMin: 15,
      },
  ];
  
export type Exam = typeof exams[0];