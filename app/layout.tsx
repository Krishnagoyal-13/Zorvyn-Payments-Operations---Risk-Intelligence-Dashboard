import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zorvyn Payments Operations & Risk Intelligence Dashboard',
  description:
    'Fintech operations dashboard demonstrating data cleaning, KPI logic, and business insights.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
