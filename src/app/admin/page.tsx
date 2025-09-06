import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Admin Panel</CardTitle>
          <CardDescription>
            Manage your exams, questions, users, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is your central hub for managing the entire ExamPrep AI platform. Use the sidebar to navigate through different sections.</p>
          <div className="mt-4">
            <Link href="/admin/exams">
              <Button>Manage Exams</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
