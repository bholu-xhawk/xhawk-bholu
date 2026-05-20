export default function AboutMe() {
  return (
    <section id="about" className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-slate-900">About Me</h2>
        <div className="mt-4 space-y-3 text-slate-700">
          <p>
            Hello! I'm a passionate developer experimenting with Next.js and Tailwind CSS. I love building clean, modern UIs and learning new technologies.
          </p>
          <p>
            This starter project showcases a simple layout with a hero section, an about section, and a projects list driven by a small data file.
          </p>
        </div>
      </div>
    </section>
  );
}
