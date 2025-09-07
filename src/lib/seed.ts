
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { exams, questions, users } from './mock-data';

async function seedExams() {
  const examsCollection = collection(db, 'exams');
  for (const exam of exams) {
    await setDoc(doc(examsCollection, exam.id), exam);
  }
}

async function seedQuestions() {
  for (const examId in questions) {
    if (Object.prototype.hasOwnProperty.call(questions, examId)) {
      const questionsCollection = collection(db, 'exams', examId, 'questions');
      const examQuestions = questions[examId];
      for (const question of examQuestions) {
        // Since some questions are generated dynamically, we need to ensure they have an id.
        if (question.id) {
          await setDoc(doc(questionsCollection, question.id), question);
        }
      }
    }
  }
}

async function seedUsers() {
    const usersCollection = collection(db, 'users');
    for (const user of users) {
        await setDoc(doc(usersCollection, user.id), user);
    }
}

async function main() {
  try {
    console.log('Seeding exams...');
    await seedExams();
    console.log('Exams seeded successfully.');

    console.log('Seeding questions...');
    await seedQuestions();
    console.log('Questions seeded successfully.');

    console.log('Seeding users...');
    await seedUsers();
    console.log('Users seeded successfully.');
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main();
