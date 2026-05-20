export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="border-t border-gray-200 py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">© {year} Your Company. All rights reserved.</p>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#hero" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            <a href="#projects" className="text-gray-600 hover:text-gray-900">Projects</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
