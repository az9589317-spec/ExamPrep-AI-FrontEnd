import { redirect } from 'next/navigation';

export default function ExamsPage() {
    // This page is no longer needed as the exam table is on the dashboard.
    // Redirect to the admin dashboard.
    redirect('/admin');
}
