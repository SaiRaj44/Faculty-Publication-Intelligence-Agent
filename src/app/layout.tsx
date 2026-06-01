import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Faculty Publication Intelligence Agent',
  description: 'AI-powered publication tracking and analytics for universities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
