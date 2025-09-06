import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PT_Sans } from 'next/font/google';

export const metadata: Metadata = {
  title: 'ExamPrep AI',
  description: 'AI-powered competitive exam preparation platform.',
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
