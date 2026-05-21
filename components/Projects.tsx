import Link from 'next/link'
import { projects } from '../data/projects'

export default function Projects() {
  return (
    <section id="projects" className="py-12">
      <h2 className="mb-6 text-2xl font-semibold">Projects</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article key={p.title} className="rounded-lg border bg-white p-5 shadow-sm transition hover:shadow">
            <h3 className="text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{t}</span>
              ))}
            </div>
            <div className="mt-4">
              <Link className="text-sm font-medium text-blue-600 hover:underline" href={p.link}>
                Learn more
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
