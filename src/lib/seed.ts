
import { collection, doc, setDoc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { exams, questions, users } from './mock-data';

async function seedExams() {
  const examsCollection = collection(db, 'exams');
  for (const exam of exams) {
    const examData = {
        ...exam,
        subCategory: exam.subCategory || [], // Ensure subCategory is always an array
    };
    await setDoc(doc(examsCollection, exam.id), examData);
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

async function seedNotifications() {
  const notificationsCollection = collection(db, 'notifications');
  const notifications = [
    {
      userId: 'user-1',
      title: 'Welcome to ExamPrep AI!',
      message: 'Explore thousands of questions and track your progress. Good luck!',
      read: false,
      createdAt: Timestamp.fromDate(new Date()),
    },
    {
      userId: 'user-1',
      title: 'New Exam Added: SSC CGL Tier 1 Mock',
      message: 'A new mock test has been added to the SSC category. Test your skills now!',
      link: '/exams/SSC/SSC CGL',
      imageUrl: 'https://picsum.photos/seed/exam-ad/400/200',
      read: false,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
    },
    {
      userId: 'user-2',
      title: 'Your Weekly Summary',
      message: 'You completed 3 exams this week with an average score of 78%. Keep it up!',
      link: '/analytics',
      read: true,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    },
  ];

  for (const notification of notifications) {
    // Using addDoc to auto-generate IDs for notifications
    await addDoc(notificationsCollection, notification as any);
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
    
    console.log('Seeding notifications...');
    await seedNotifications();
    console.log('Notifications seeded successfully.');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main();
