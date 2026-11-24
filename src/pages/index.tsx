/**
 * Landing — static front door. Brand-first, one composition, one CTA.
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { APP_NAME } from '../constants'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div
        data-testid="static-landing"
        className="relative min-h-screen overflow-hidden text-foreground"
      >
        <div
          className="pointer-events-none absolute inset-0 trip-hero-bg"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-end px-6 pb-16 pt-24 sm:justify-center sm:pb-24">
          <p className="mb-3 font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-[var(--trip-sand)] uppercase">
            {APP_NAME}
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-6xl">
            Sketch a trip from a place and a vibe.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
            Destination in, day-by-day plan and a travel cover out — researched
            live, ready to share.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/home"
              className="inline-flex items-center bg-[var(--trip-sand)] px-6 py-3 text-sm font-semibold text-[var(--trip-deep)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start a sketch
            </Link>
            <span className="text-sm text-white/60">Sign in · generate · share</span>
          </div>
        </div>
      </div>
    </>
  )
}
