import { ArrowRight, Bot, CheckCircle2, Leaf, ShieldCheck, Users, Wind } from 'lucide-react';
import type { EnvironmentalSnapshot, PageId } from '../types/airwise.ts';
import { Logo } from '../components/Logo.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { AqiStatusBadge } from '../components/AqiBadge.tsx';
import { formatSafeTime } from '../lib/format.ts';

interface LandingPageProps {
  snapshot: EnvironmentalSnapshot;
  onNavigate: (page: PageId) => void;
}

interface CapabilityQuestion {
  codeLabel: string;
  eyebrowClass: string;
  question: string;
  description: string;
  ctaLabel: string;
  hoverClass: string;
  targetPage: PageId;
  colSpanClass: string;
}

const FIVE_QUESTIONS: readonly CapabilityQuestion[] = [
  {
    codeLabel: '01. Ambient Safety',
    eyebrowClass: 'text-emerald-700',
    question: 'How safe is the air around me?',
    description:
      'Compare official Indian CPCB NAQI categories, US EPA AQI, and WHO 2021 guideline multiples with live PM2.5, PM10, NO2, SO2, CO, and O3 readings.',
    ctaLabel: 'Inspect Live Dashboard',
    hoverClass: 'hover:text-emerald-700',
    targetPage: 'dashboard',
    colSpanClass: 'md:col-span-3',
  },
  {
    codeLabel: '02. Family Action',
    eyebrowClass: 'text-sky-700',
    question: 'What should my family do today?',
    description:
      'Receive morning-to-night schedules and AI-assisted natural language guidance adapted to children, older adults, commuters, and respiratory sensitivities.',
    ctaLabel: 'Open Daily Routine Planner',
    hoverClass: 'hover:text-sky-700',
    targetPage: 'routine',
    colSpanClass: 'md:col-span-3',
  },
  {
    codeLabel: '03. Home Protection',
    eyebrowClass: 'text-emerald-700',
    question: 'How can I protect indoor air quality?',
    description:
      'Room-by-room checklists for ventilation timing, HEPA filtration, kitchen exhaust, damp cleaning, and humidity control.',
    ctaLabel: 'Open Indoor Optimizer',
    hoverClass: 'hover:text-emerald-700',
    targetPage: 'indoor',
    colSpanClass: 'md:col-span-2',
  },
  {
    codeLabel: '04. Daily Habits',
    eyebrowClass: 'text-amber-800',
    question: 'Which habits reduce exposure & emissions?',
    description:
      'Actionable alternatives across transport, home energy, and household routines with transparent confidence ratings.',
    ctaLabel: 'Explore Sustainability Hub',
    hoverClass: 'hover:text-amber-800',
    targetPage: 'sustainability',
    colSpanClass: 'md:col-span-2',
  },
  {
    codeLabel: '05. Measurable Impact',
    eyebrowClass: 'text-[#102A43]',
    question: 'How much impact can my choices create?',
    description:
      'Calculate daily, weekly, monthly, and annual CO2e savings from documented emission factors with clear assumptions.',
    ctaLabel: 'Launch Impact Calculator',
    hoverClass: 'hover:text-sky-700',
    targetPage: 'calculator',
    colSpanClass: 'md:col-span-2',
  },
];

export function LandingPage({ snapshot, onNavigate }: LandingPageProps) {
  const isLive = snapshot.dataStatus === 'LIVE' || snapshot.dataStatus === 'CACHED';

  return (
    <div className="min-h-screen bg-[#F4F8FB] text-[#102A43]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#102A43] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          <Logo onClick={() => onNavigate('landing')} />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700" aria-label="Primary">
            <a href="#live-air" className="hover:text-[#102A43] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded">
              Live Air
            </a>
            <a href="#family-shield" className="hover:text-[#102A43] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded">
              Family Shield
            </a>
            <a href="#impact" className="hover:text-[#102A43] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded">
              Impact
            </a>
            <a href="#community" className="hover:text-[#102A43] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded">
              Community
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a3f63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] whitespace-nowrap shrink-0"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {/* Hero Section */}
        <section id="live-air" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:py-16">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-emerald-700">
                Urban Environmental Intelligence · CPCB & WHO Aligned
              </p>
              <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#102A43] leading-[1.08] text-balance sm:text-5xl lg:text-[3.4rem]">
                Breathe Better. Live Smarter.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Your intelligent companion for cleaner air, healthier homes, and sustainable everyday living.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3f63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] whitespace-nowrap"
                >
                  <span>Explore My Air Quality</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('assistant')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#102A43] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] whitespace-nowrap"
                >
                  <Bot className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>Meet Your AI Assistant</span>
                </button>
              </div>

              {/* Live AQI Preview Strip */}
              <div className="mt-8 rounded-xl border border-slate-200 bg-[#F4F8FB] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    {isLive ? 'Live Regional Reading' : 'Offline Demonstration Snapshot'} ·{' '}
                    <strong className="text-[#102A43]">
                      {snapshot.location.name}, {snapshot.location.country}
                    </strong>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatSafeTime(snapshot.measuredAt)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <AqiStatusBadge category={snapshot.cpcbCategory} aqi={snapshot.cpcbAqi} />
                  <div className="flex items-center gap-5 text-xs">
                    <div>
                      <span className="block text-slate-600">PM2.5</span>
                      <span className="font-mono text-sm font-semibold text-[#102A43] tabular-nums">
                        {snapshot.pollutants.pm25 !== null ? `${snapshot.pollutants.pm25} µg/m³` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600">US AQI</span>
                      <span className="font-mono text-sm font-semibold text-[#102A43] tabular-nums">
                        {snapshot.usAqi ?? 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600">Wind</span>
                      <span className="font-mono text-sm font-semibold text-[#102A43] tabular-nums">
                        {snapshot.weather.windSpeedKmh !== null ? `${snapshot.weather.windSpeedKmh} km/h` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-full">
                <SafeImage
                  src="/src/assets/images/hero_clean_city_1794843521205.jpg"
                  alt="Sunlit modern green urban neighborhood with clear sky and pedestrian promenade"
                  fallbackTitle="Clean Urban Living"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Five Questions / Core Capabilities */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#102A43] sm:text-3xl">
              Five practical questions answered with scientific clarity
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Every insight separates measured atmospheric data from estimates and explains what to do, why it matters, when to act, and its limitations.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-6">
            {FIVE_QUESTIONS.map((item) => (
              <div
                key={item.codeLabel}
                className={`rounded-xl border border-slate-200 bg-white p-6 ${item.colSpanClass}`}
              >
                <p className={`font-mono text-xs font-semibold ${item.eyebrowClass}`}>
                  {item.codeLabel}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold text-[#102A43]">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(item.targetPage)}
                  className={`mt-4 rounded text-xs font-semibold text-[#102A43] underline underline-offset-4 ${item.hoverClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]`}
                >
                  {item.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* How AIRWISE AI Works */}
        <section className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-[#102A43]">How AIRWISE AI works</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <p className="font-mono text-xs font-semibold text-slate-600">Step 01</p>
                <h3 className="mt-1 font-display text-base font-bold text-[#102A43]">
                  Fetch verified atmospheric & weather feeds
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Server-side requests pull hourly pollutant concentrations and wind/humidity data for your chosen city or coordinates after permission.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs font-semibold text-slate-600">Step 02</p>
                <h3 className="mt-1 font-display text-base font-bold text-[#102A43]">
                  Contextualize for your household profile
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Without collecting personal medical records, recommendations adjust for children, older adults, daily commuters, or indoor workers.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs font-semibold text-slate-600">Step 03</p>
                <h3 className="mt-1 font-display text-base font-bold text-[#102A43]">
                  Turn readings into low-exposure, low-carbon habits
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Review morning-to-night schedules, safe ventilation windows, and measurable CO2e reductions in one unified workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Family Protection & Indoor Air */}
        <section id="family-shield" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-full">
                <SafeImage
                  src="/src/assets/images/family_clean_home_1794843520942.jpg"
                  alt="Modern sunlit apartment living room with HEPA air purifier near window"
                  fallbackTitle="Clean Indoor Living Environment"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-7 lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Family & Indoor Air Shield</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#102A43]">
                Built for severe winter smog and everyday indoor living
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                When outdoor AQI crosses into Poor, Very Poor, or Severe territory, families spend up to 90% of their time indoors. AIRWISE AI guides safe cross-ventilation timing, bedroom clean-air zones, kitchen range hood venting, and damp dust removal—while transparently explaining filter limitations.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>Room-by-room checklist across 5 home spaces</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>Dynamic ventilation & smog alerts</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => onNavigate('indoor')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1a3f63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  <span>Open Indoor Air Optimizer</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability & Community */}
        <section id="impact" className="border-t border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700">
                <Leaf className="h-4 w-4" aria-hidden="true" />
                <span>Sustainability & Collective Action</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#102A43]">
                Quantify emissions saved with transparent methodology
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Use documented emission factors to calculate daily, monthly, and annual CO2e reductions from shifting car trips to metro/bus, carpooling, cutting standby electricity, and avoiding open waste burning.
              </p>

              <div id="community" className="mt-6 rounded-xl border border-slate-200 bg-[#F4F8FB] p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
                  <Users className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>Community Air Quality Hub</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Join weekly neighborhood challenges, estimate collective 100-home impact, and generate privacy-safe awareness cards without exposing personal location data.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('calculator')}
                    className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a3f63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    Open Carbon Calculator
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('community')}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#102A43] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    Visit Community Hub
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:h-full">
                <SafeImage
                  src="/src/assets/images/sustainable_commute_1794843521630.jpg"
                  alt="Electric light-rail tram and shaded urban bicycle lane at golden hour"
                  fallbackTitle="Low-Emission Urban Mobility"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Transparency */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#102A43]">
              <Wind className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Trust, Scientific Integrity & Privacy</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 text-sm text-slate-600 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-[#102A43]">No Invented Measurements</h3>
                <p className="mt-1 text-xs leading-relaxed">
                  Live air quality and weather arrive via server-side API calls. If a provider is unreachable, AIRWISE AI explicitly marks the view as DEMO DATA or DATA UNAVAILABLE.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#102A43]">Clear Standard Distinctions</h3>
                <p className="mt-1 text-xs leading-relaxed">
                  Indian CPCB NAQI categories, US EPA AQI breakpoints, and WHO 2021 health guidelines are presented side by side so families never confuse scales.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#102A43]">Privacy-First Architecture</h3>
                <p className="mt-1 text-xs leading-relaxed">
                  Location detection runs only after explicit permission. Household preferences stay in local browser storage with one-click deletion in Settings & Privacy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-[#102A43]">AIRWISE AI · Urban Air Quality Assistant</p>
            <p className="mt-1">
              Environmental decision support only. Not a substitute for medical diagnosis or emergency civic advisories.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded px-1">
              Dashboard
            </button>
            <button type="button" onClick={() => onNavigate('assistant')} className="hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded px-1">
              AI Assistant
            </button>
            <button type="button" onClick={() => onNavigate('insights')} className="hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded px-1">
              Insights
            </button>
            <button type="button" onClick={() => onNavigate('settings')} className="hover:text-[#102A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded px-1">
              Settings & Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
