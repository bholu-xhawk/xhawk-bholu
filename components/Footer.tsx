export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="container py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} My Portfolio. All rights reserved.</p>
        <nav className="flex gap-4">
          <a href="#about" className="hover:text-slate-900">About</a>
          <a href="#projects" className="hover:text-slate-900">Projects</a>
          <a href="https://github.com/example" target="_blank" rel="noreferrer" className="hover:text-slate-900">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
