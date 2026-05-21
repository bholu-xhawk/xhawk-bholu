import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} My Portfolio. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link className="hover:text-gray-900" href="#">Home</Link>
            <Link className="hover:text-gray-900" href="#about">About</Link>
            <Link className="hover:text-gray-900" href="#projects">Projects</Link>
            <a className="hover:text-gray-900" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
