# Next.js 14 Landing Page Starter

This repository contains a minimal Next.js 14 (App Router) project written in TypeScript and styled with Tailwind CSS. It includes a single landing page composed of Hero, About, Projects, and Footer sections with dummy content.

## Setup

- Node.js 18+ required
- Install dependencies: `npm install`
- Run the development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`

## Project structure

- src/app: App Router entry points (layout.tsx, page.tsx) and global styles (globals.css)
- src/components: Reusable UI sections/components (Hero, About, Projects, Footer)
- src/data: Dummy data (projects.ts)

## Notes

- Tailwind CSS is configured via tailwind.config.js and postcss.config.js
- TypeScript is configured with a strict tsconfig.json
- next.config.ts is minimal and can be extended as needed