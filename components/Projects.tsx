import { projects } from '../data/projects';

export default function Projects() {
  return (
    <section id="projects" className="py-8">
      <h3 className="text-2xl font-semibold">Projects</h3>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <a
            key={p.title}
            href={p.link}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <h4 className="text-lg font-medium">{p.title}</h4>
            <p className="mt-2 text-slate-600">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
