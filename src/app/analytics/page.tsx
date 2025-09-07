import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              This is the analytics page. Detailed performance metrics will be displayed here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Analytics content coming soon...</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
