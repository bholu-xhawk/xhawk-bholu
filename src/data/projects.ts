export type Project = {
  title: string;
  description: string;
  tech: string[];
  link: string;
};

export const projects: Project[] = [
  {
    title: "Next.js Starter",
    description: "A simple Next.js 14 + Tailwind starter with TypeScript and the App Router.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS"],
    link: "https://nextjs.org/"
  },
  {
    title: "UI Components",
    description: "A set of reusable UI components styled with Tailwind CSS.",
    tech: ["React", "Tailwind CSS"],
    link: "https://tailwindcss.com/"
  },
  {
    title: "Data Viz Demo",
    description: "An example dashboard showing charts and stats with dummy data.",
    tech: ["React", "D3.js"],
    link: "https://react.dev/"
  }
];
