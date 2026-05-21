export type Project = {
  title: string
  description: string
  tags: string[]
  link: string
}

export const projects: Project[] = [
  {
    title: 'Portfolio Website',
    description: 'A personal portfolio built with Next.js and Tailwind CSS to showcase projects and blog posts.',
    tags: ['Next.js', 'Tailwind', 'TypeScript'],
    link: '#'
  },
  {
    title: 'E-commerce Prototype',
    description: 'A mock e-commerce storefront demonstrating product listings and a cart experience.',
    tags: ['React', 'Context API', 'Vercel'],
    link: '#'
  },
  {
    title: 'UI Component Library',
    description: 'Reusable, accessible UI components with Storybook documentation.',
    tags: ['Storybook', 'Accessibility', 'CSS'],
    link: '#'
  }
]
