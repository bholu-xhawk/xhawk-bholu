import { projects } from "../data/projects";

export default function Projects() {
  return (
    <section id="projects" className="bg-gray-50 py-20 sm:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Projects</h2>
          <p className="mt-4 text-gray-600">A few examples of things you might showcase.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <a
              key={p.title}
              href={p.link}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{p.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tech.map((t) => (
                  <span key={t} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
