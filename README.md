# Next.js 14 App Router + Tailwind Starter

A minimal Next.js 14 + TypeScript + Tailwind CSS starter scaffolded for the App Router. It includes a simple homepage with Hero, About Me, Projects sections, and a site-wide Footer.

## Quick Start

- Prerequisites: Node.js 18+ (recommended 20+)
- Install dependencies:
  - npm install
- Run the dev server:
  - npm run dev
- Open http://localhost:3000

## What’s Included

- Next.js 14 (App Router) with TypeScript
- Tailwind CSS configured via PostCSS
- Example components and sections:
  - Hero with placeholder image
  - About Me section
  - Projects section with dummy data
  - Global Footer

## Project Structure

- app/
  - layout.tsx — Root layout, imports globals and includes Footer
  - page.tsx — Homepage composing sections
  - globals.css — Tailwind directives and base styles
- components/
  - Hero.tsx
  - AboutMe.tsx
  - Projects.tsx
  - Footer.tsx
- data/
  - projects.ts — Dummy project data

## Notes

- Tailwind scans app and components directories (see tailwind.config.ts)
- External images are allowed from via.placeholder.com (see next.config.ts)
