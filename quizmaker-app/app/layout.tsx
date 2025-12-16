/**
 * Root Layout Component
 * 
 * This is the root layout for the entire application.
 * It wraps all pages and provides common structure.
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuizMaker - Quiz Management & Assessment Platform',
  description: 'A comprehensive quiz management platform for educators and learners. Create engaging quizzes, track progress, and measure success.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

