import CinematicHero from '../../components/public/CinematicHero'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  MapPin,
  ShieldCheck,
  ChartNoAxesCombined,
  Store,
  Plus,
} from 'lucide-react'

import PublicLayout from '../../components/layout/PublicLayout'
import Reveal from '../../components/public/Reveal'

const categories = [
  {
    name: 'Hair & beauty',
    description: 'Find your next signature look.',
    image: '/images/landing/hair-beauty.webp',
    filter: 'Beauty',
  },
  {
    name: 'Spa & wellness',
    description: 'Relax, recharge and feel renewed.',
    image: '/images/landing/spa-wellness.webp',
    filter: 'Spa',
  },
  {
    name: 'Grooming',
    description: 'Look sharp. Feel confident.',
    image: '/images/landing/grooming.webp',
    filter: 'Grooming',
  },
  {
    name: 'Fitness & lifestyle',
    description: 'Make time for a healthier you.',
    image: '/images/landing/fitness.webp',
    filter: 'Fitness',
  },
]

const steps = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Explore services and find a business that suits your needs.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Book',
    description:
      'Choose your preferred service, date and available time.',
    icon: CalendarDays,
  },
  {
    number: '03',
    title: 'Enjoy',
    description:
      'Manage your appointment and enjoy your experience.',
    icon: CheckCircle2,
  },
]

const benefits = [
  {
    title: 'Effortless scheduling',
    description: 'Manage appointments from one organized workspace.',
    icon: CalendarDays,
  },
  {
    title: 'Business insights',
    description: 'Understand performance with analytics and reports.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Customer management',
    description: 'Keep customer information and booking history organized.',
    icon: Store,
  },
]

const questions = [
  {
    question: 'How do I book an appointment?',
    answer:
      'Create a customer account, explore available services, choose an appointment time and submit your booking request.',
  },
  {
    question: 'Can I cancel my appointment?',
    answer:
      'You can manage eligible cancellations from your customer workspace, subject to the applicable cancellation policy.',
  },
  {
    question: 'How do I register my business?',
    answer:
      'Create a provider account, enter your business details, configure your working hours and add your services.',
  },
  {
    question: 'Does BookEase process payments?',
    answer:
      'BookEase currently manages appointments and service prices. Payments are arranged directly with the service provider.',
  },
  {
    question: 'Can I use BookEase on my phone?',
    answer:
      'Yes. BookEase is designed for mobile phones, tablets and desktop browsers.',
  },
]

const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover'

export default function LandingPage() {
  return (
    <PublicLayout>

      <CinematicHero />

      {/* Platform benefits strip */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-7 text-center lg:grid-cols-4 lg:px-8">
          {[
            [CalendarDays, 'Easy appointments'],
            [MapPin, 'Local businesses'],
            [Clock3, 'Flexible scheduling'],
            [ShieldCheck, 'Secure experience'],
          ].map(([Icon, label]) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 sm:flex-row"
            >
              <Icon size={21} className="text-primary" />
              <span className="text-xs font-medium text-muted sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Service categories */}
      <section
        id="services"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28"
      >
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Discover experiences
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Something for every lifestyle.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Explore the types of services BookEase is designed
            to bring together.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {


            return (
              <Reveal key={category.name} delay={index * 0.07}>
                <article className="group h-full rounded-[24px] border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:shadow-elevated">
                  
<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted">
  <img
    src={category.image}
    alt={category.name}
    loading="lazy"
    decoding="async"
    className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
  />
</div>

                  <h3 className="mt-6 text-lg font-bold">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {category.description}
                  </p>

                  <Link
                    to={`/services?category=${encodeURIComponent(category.filter)}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Explore services
                    <ArrowUpRight size={16} />
                  </Link>
                </article>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-border bg-surface py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Simple by design
            </p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">
              Three steps. Zero complexity.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <Reveal key={step.number} delay={index * 0.1}>
                  <article className="h-full rounded-[24px] border border-border bg-background p-8">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl bg-primary-soft p-4 text-primary">
                        <Icon size={28} />
                      </div>
                      <span className="text-4xl font-bold text-muted/30">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-7 text-2xl font-bold">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {step.description}
                    </p>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28"
      >
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-primary-soft">
            <img
              src="/images/landing/about.webp"
              alt="A thoughtfully designed wellness environment"
              loading="lazy"
              className="h-[380px] w-full object-cover sm:h-[480px]"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            About BookEase
          </p>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            More time for what matters.
          </h2>

          <p className="mt-6 leading-8 text-muted">
            We believe booking an appointment should be as
            enjoyable as the experience itself. BookEase brings
            customers and local service businesses together
            through a simple digital platform.
          </p>

          <p className="mt-4 leading-8 text-muted">
            Our mission is to remove unnecessary complexity
            from appointment scheduling while helping businesses
            stay organized and understand their performance.
          </p>

          <div className="mt-7 space-y-4">
            {[
              'Designed around real customer needs',
              'Built for independent service businesses',
              'Simple, accessible and responsive',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle2 size={20} className="shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Business onboarding */}
      <section
        id="business"
        className="scroll-mt-24 px-5 pb-20 lg:px-8"
      >
        <Reveal className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[32px] bg-[#193C2E] p-8 text-white sm:p-12 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3C5AE]">
                  Built for your business
                </p>

                <h2 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
                  Focus on your craft.
                  We simplify the booking.
                </h2>

                <p className="mt-6 leading-8 text-white/75">
                  Manage services, appointments, customers
                  and business performance from one workspace.
                </p>

                <Link
                  to="/register?role=provider"
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#193C2E]"
                >
                  Register your business
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon

                  return (
                    <div
                      key={benefit.title}
                      className="flex gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
                    >
                      <div className="h-fit rounded-xl bg-white/10 p-3">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold">
                          {benefit.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-5 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
      >
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Need to know
          </p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
            Frequently asked questions.
          </h2>
          <p className="mt-5 leading-7 text-muted">
            Everything you need to get started with BookEase.
          </p>
        </Reveal>

        <Reveal className="space-y-3">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border bg-surface p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.question}
                <Plus
                  size={20}
                  className="shrink-0 text-primary transition-transform group-open:rotate-45"
                />
              </summary>

              <p className="mt-4 text-sm leading-7 text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-primary-soft px-5 py-20 text-center">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your next experience starts here.
          </h2>

          <p className="mt-5 leading-7 text-muted">
            Create your BookEase account and discover
            a simpler way to manage your appointments.
          </p>

          <Link to="/register" className={`${primaryButton} mt-8`}>
            Get started
            <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </section>

    </PublicLayout>
  )
}
