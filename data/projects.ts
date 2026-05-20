export type Project = {
  title: string;
  description: string;
  tags: string[];
  link: string;
};

export const projects: Project[] = [
  {
    title: 'Next.js Starter',
    description: 'A basic Next.js 14 + Tailwind starter with App Router.',
    tags: ['Next.js', 'Tailwind', 'TypeScript'],
    link: 'https://example.com/next-starter',
  },
  {
    title: 'Portfolio Site',
    description: 'A personal portfolio showcasing projects and blog posts.',
    tags: ['React', 'UI', 'Design'],
    link: 'https://example.com/portfolio',
  },
  {
    title: 'API Playground',
    description: 'Experimenting with REST and GraphQL APIs in a full-stack setup.',
    tags: ['API', 'GraphQL', 'REST'],
    link: 'https://example.com/api-playground',
  },
];
