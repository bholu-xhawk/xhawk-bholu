export type Project = {
  title: string;
  description: string;
  tags: string[];
  link: string;
};

export const projects: Project[] = [
  {
    title: 'Next.js Starter',
    description: 'A basic Next.js 14 + Tailwind setup with a few components.',
    tags: ['Next.js', 'TypeScript', 'Tailwind'],
    link: '#',
  },
  {
    title: 'Design System',
    description: 'Exploring reusable UI components and patterns using Tailwind.',
    tags: ['UI', 'Tailwind', 'Components'],
    link: '#',
  },
  {
    title: 'API Integration',
    description: 'Demo app integrating a simple REST API for content.',
    tags: ['API', 'React', 'Fetch'],
    link: '#',
  },
];
