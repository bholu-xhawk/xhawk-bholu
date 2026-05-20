import React from 'react';

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-4 sm:grid-cols-3">
        <div>
          <h3 className="font-semibold text-slate-900">Links</h3>
          <ul className="mt-2 space-y-1 text-slate-600 text-sm">
            <li><a className="hover:text-slate-900" href="#about">About</a></li>
            <li><a className="hover:text-slate-900" href="#projects">Projects</a></li>
            <li><a className="hover:text-slate-900" href="#contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Social</h3>
          <ul className="mt-2 space-y-1 text-slate-600 text-sm">
            <li><a className="hover:text-slate-900" href="#">Twitter</a></li>
            <li><a className="hover:text-slate-900" href="#">GitHub</a></li>
            <li><a className="hover:text-slate-900" href="#">LinkedIn</a></li>
          </ul>
        </div>
        <div className="text-sm text-slate-600">
          <p>&copy; {new Date().getFullYear()} My Portfolio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
