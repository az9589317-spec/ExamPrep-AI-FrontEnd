'use server';

import { generateCustomMockExam, type GenerateCustomMockExamInput } from '@/ai/flows/generate-custom-mock-exam';

export async function generateCustomMockExamAction(input: GenerateCustomMockExamInput) {
    try {
        const exam = await generateCustomMockExam(input);

        // In a real-world application, this is where you would save the generated
        // exam to your database (e.g., Firestore) and get a unique ID for it.
        // For example:
        // const examRef = await db.collection('exams').add({
        //   ...exam,
        //   createdBy: 'user_id', // Add user info
        //   createdAt: serverTimestamp(),
        //   status: 'draft',
        // });
        // return { examId: examRef.id };

        // For this demonstration, we'll just return the generated data.
        // The client component will handle the redirection to a placeholder page.
        if (!exam || !exam.questions || exam.questions.length === 0) {
            throw new Error("AI failed to generate questions.");
        }
        
        return JSON.parse(JSON.stringify(exam));
    } catch (error) {
        console.error("Error in generateCustomMockExamAction:", error);
        // It's better to throw a more specific error or handle it gracefully.
        throw new Error("Failed to generate custom mock exam.");
    }
}
