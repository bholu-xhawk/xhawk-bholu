import Hero from '../components/Hero'
import AboutMe from '../components/AboutMe'
import Projects from '../components/Projects'

export default function HomePage() {
  return (
    <main className="space-y-12 py-8">
      <Hero />
      <AboutMe />
      <Projects />
    </main>
  )
}
