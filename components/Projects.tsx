import { projects } from '../data/projects';

export default function Projects() {
  return (
    <section id="projects" className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-slate-900">Projects</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <article key={p.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-slate-600 text-sm">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{t}</span>
                ))}
              </div>
              <a href={p.link} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">View Project</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
