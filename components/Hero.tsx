import Image from 'next/image'

export default function Hero() {
  return (
    <section className="py-12">
      <div className="relative h-56 w-full overflow-hidden rounded-lg sm:h-72 md:h-96">
        <Image
          src="https://via.placeholder.com/1200x400"
          alt="Hero placeholder"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hello, I\'m Jane Doe</h1>
        <p className="mt-3 text-gray-600">Frontend developer crafting clean, accessible web experiences.</p>
      </div>
    </section>
  )
}
