import type { Metadata } from 'next';
import './globals.css';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'My Portfolio',
  description: 'A simple Next.js 14 + Tailwind portfolio starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="container py-6">
            <h1 className="text-xl font-semibold">My Portfolio</h1>
          </div>
        </header>
        <main className="container flex-1 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
