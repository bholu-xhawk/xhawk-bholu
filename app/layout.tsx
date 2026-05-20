import './globals.css';
import type { Metadata } from 'next';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'My Next.js Portfolio',
  description: 'A simple Next.js 14 + Tailwind starter with sections.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-5xl px-4 py-4">
              <h1 className="text-xl font-semibold text-slate-900">My Portfolio</h1>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
