# Next.js 14 + Tailwind Starter

A minimal Next.js 14 (App Router) + TypeScript + Tailwind CSS starter with a simple portfolio homepage.

## Quick Start

- Requires Node.js v20+
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Start production server: `npm run start`

## Project Structure

- `app/` — App Router entry with `layout.tsx` and `page.tsx`
- `components/` — Reusable UI components (Hero, AboutMe, Projects, Footer)
- `data/` — Dummy dataset for projects
- `tailwind.config.ts` — Tailwind configuration
- `postcss.config.js` — PostCSS plugins
- `tsconfig.json` — TypeScript configuration

## Notes

- The hero section uses a placeholder image hosted on via.placeholder.com and the domain is allowed in `next.config.ts`.
- Tailwind content paths target `app/` and `components/` directories.
