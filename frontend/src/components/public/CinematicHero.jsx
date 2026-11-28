import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDown,
  Sparkles,
  ShieldCheck,
  Clock3,
  Search,
  MapPin,
  Play,
  Pause,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

export default function CinematicHero() {
  const navigate = useNavigate()
  const videoRef = useRef(null)

  function handleSearch(event) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const params = new URLSearchParams()

    for (const name of ['search', 'location']) {
      const value = String(data.get(name) || '').trim()
      if (value) params.set(name, value)
    }

    navigate(`/services${params.size ? `?${params}` : ''}`)
  }
  const reducedMotion = useReducedMotion()

  const [playing, setPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video || reducedMotion) return

    video.play().catch(() => setPlaying(false))
  }, [reducedMotion])

  async function togglePlayback() {
    const video = videoRef.current

    if (!video) return

    if (video.paused) {
      try {
        await video.play()
      } catch {
        setPlaying(false)
      }
    } else {
      video.pause()
    }
  }

  const entrance = (delay = 0) => ({
    initial: reducedMotion
      ? false
      : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reducedMotion ? 0 : 0.8,
      delay: reducedMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  })

  return (
    <section
      id="home"
      className="relative isolate flex min-h-[calc(100svh-5rem)] flex-col justify-center overflow-hidden bg-black text-white"
    >
      {/* Static background and fallback */}
      <img
        src="/images/landing/hero-poster.webp"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-30 h-full w-full object-cover"
      />

      {/* Cinematic video */}
      {!reducedMotion && !videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/landing/hero-poster.webp"
          aria-hidden="true"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => {
            setVideoFailed(true)
            setPlaying(false)
          }}
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
        >
          <source
            src="/videos/hero-background.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* Cinematic overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* Main content */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-28 pt-20 sm:px-8 lg:py-28">

        <motion.div {...entrance()}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold tracking-wide backdrop-blur-xl">
            <Sparkles size={16} className="text-[#C6E0CC]" />
            A better way to book
          </span>
        </motion.div>

        <motion.h1
          {...entrance(0.12)}
          className="mt-8 max-w-5xl font-heading text-[clamp(2.8rem,6vw,5.8rem)] font-extrabold leading-[1.08] tracking-[-0.05em]"
        >
          Exceptional services.
          <span className="mt-2 block text-[#C6E0CC]">
            Effortless booking.
          </span>
        </motion.h1>

        <motion.p
          {...entrance(0.24)}
          className="mt-7 max-w-xl text-base leading-8 text-white/85 sm:text-lg"
        >
          Discover local businesses, find experiences you love
          and book appointments that fit your lifestyle.
          Your time, your choice.
        </motion.p>

        <motion.div
          {...entrance(0.36)}
          className="mt-9 flex flex-wrap gap-4"
        >
          <Link
            to="/services"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#DDECE0] px-7 py-4 text-sm font-bold text-[#193C2E] transition hover:bg-white"
          >
            Explore services
            <ArrowUpRight size={19} />
          </Link>

          <a
            href="#business"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/40 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
          >
            For businesses
            <ArrowUpRight size={19} />
          </a>
        </motion.div>


        {/* Glass discovery panel */}
        <motion.form
          {...entrance(0.48)}
          onSubmit={handleSearch}
          className="mt-12 grid max-w-4xl gap-4 rounded-[24px] border border-white/25 bg-white/10 p-5 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.2fr_1fr_auto] lg:items-center sm:p-7"
        >
          <label className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-white/15 p-3">
              <Search size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-xs text-white/80">
                What are you looking for?
              </span>

              <input
                name="search"
                type="search"
                placeholder="Haircut, massage, yoga..."
                className="mt-1 w-full bg-transparent py-2 text-sm font-semibold text-white placeholder:text-white/60"
              />
            </div>
          </label>

          <label className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-white/15 p-3">
              <MapPin size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-xs text-white/80">
                Location
              </span>

              <input
                name="location"
                type="search"
                placeholder="Westlands, Nairobi..."
                className="mt-1 w-full bg-transparent py-2 text-sm font-semibold text-white placeholder:text-white/60"
              />
            </div>
          </label>

          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#193C2E] transition hover:bg-[#DDECE0]"
          >
            <Search size={18} />
            Find services
          </button>
        </motion.form>

        <motion.div
          {...entrance(0.6)}
          className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#C6E0CC]" />
            Secure accounts
          </span>

          <span className="inline-flex items-center gap-2">
            <Clock3 size={18} className="text-[#C6E0CC]" />
            Convenient scheduling
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#services"
        aria-label="Scroll to services"
        className="absolute bottom-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-lg transition hover:bg-white/20"
      >
        <ArrowDown size={20} />
      </a>

      {/* Accessible video controls */}
      {!reducedMotion && !videoFailed && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={
            playing
              ? 'Pause background video'
              : 'Play background video'
          }
          className="absolute bottom-6 right-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/30 backdrop-blur-lg transition hover:bg-white/20 sm:right-8"
        >
          {playing ? <Pause size={19} /> : <Play size={19} />}
        </button>
      )}
    </section>
  )
}
