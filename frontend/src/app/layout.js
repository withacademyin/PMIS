import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'Hiring Portal — Enterprise Internship & Skill Matching',
  description: 'AI-assisted technical screening and deterministic skill matching portal for Learners, Recruiters, and Academic Admins.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
