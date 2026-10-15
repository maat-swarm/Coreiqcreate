import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  MessageCircle, 
  Mail, 
  Check, 
  X, 
  Lock, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { NavRoute } from '../types';

interface AboutPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

// =============================================================================
// TYPED DATA ARRAYS
// =============================================================================

interface TimelineStep {
  name: string;
  summary: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { name: 'Understand', summary: 'We ask what is not working and what result you need before writing code.' },
  { name: 'Design', summary: 'We sketch the simplest way to solve it cleanly on a phone screen.' },
  { name: 'Build', summary: 'We assemble the site, web application, or automation pipeline.' },
  { name: 'Connect', summary: 'We wire it to your WhatsApp, email, or internal spreadsheet.' },
  { name: 'Launch', summary: 'We test with real inputs, verify edge cases, and put it live.' },
  { name: 'Improve', summary: 'We fix what breaks and refine what works as your business evolves.' },
];

interface ProjectStartStep {
  number: string;
  step: string;
}

const PROJECT_START_STEPS: ProjectStartStep[] = [
  {
    number: '01',
    step: 'Send your website address or current problem on WhatsApp or email.',
  },
  {
    number: '02',
    step: 'We rebuild your homepage free and send a live link within 5 working days.',
  },
  {
    number: '03',
    step: 'You decide: yes gets a fixed quote, no means you owe nothing.',
  },
  {
    number: '04',
    step: 'We build, you review, and we launch.',
  },
];

interface BuildSize {
  name: string;
  scope: string;
  revisions: string;
  pricingType: string;
}

const BUILD_SIZES: BuildSize[] = [
  {
    name: 'Starter Build',
    scope: 'Single-purpose site or simple app for a focused business goal.',
    revisions: 'One revision round included.',
    pricingType: 'Fixed price',
  },
  {
    name: 'Full Build',
    scope: 'Multi-page site or custom application with complete domain deployment.',
    revisions: 'Up to three revision rounds included.',
    pricingType: 'Fixed price',
  },
  {
    name: 'Maintained',
    scope: 'Ongoing cloud hosting, uptime monitoring, and monthly maintenance updates.',
    revisions: 'Continuous operational support.',
    pricingType: 'Monthly fee',
  },
];

interface Principle {
  title: string;
  sentence: string;
}

const PRINCIPLES: Principle[] = [
  {
    title: 'Start with the problem.',
    sentence: "We ask what you're trying to fix before we propose anything.",
  },
  {
    title: 'Use the smallest useful system.',
    sentence: "If a simple page does the job, we won't sell you an app.",
  },
  {
    title: 'Connect it to how you already work.',
    sentence: 'We fit your existing WhatsApp, email and spreadsheets rather than forcing unfamiliar software.',
  },
  {
    title: 'Test it in reality.',
    sentence: 'On a real phone, with real inputs, under normal South African mobile conditions.',
  },
  {
    title: 'Be honest about limits.',
    sentence: "If we're unsure or it's outside our skills, we say so.",
  },
];

interface LegalDoc {
  title: string;
  group: 'Core Policies' | 'Commercial & Security';
  href?: string;
  status: 'live' | 'in-preparation';
}

const LEGAL_DOCUMENTS: LegalDoc[] = [
  { title: 'Terms of Use', group: 'Core Policies', status: 'in-preparation' },
  { title: 'Privacy Policy', group: 'Core Policies', status: 'in-preparation' },
  { title: 'AI Use and Disclaimer', group: 'Core Policies', status: 'in-preparation' },
  { title: 'Cookie Notice', group: 'Core Policies', status: 'in-preparation' },
  { title: 'Services Agreement', group: 'Commercial & Security', status: 'in-preparation' },
  { title: 'Mutual NDA', group: 'Commercial & Security', status: 'in-preparation' },
  { title: 'Data Processing Terms', group: 'Commercial & Security', status: 'in-preparation' },
  { title: 'Security and Disclosure Policy', group: 'Commercial & Security', status: 'in-preparation' },
];

const SECTIONS = [
  { id: 'hero', label: 'Overview' },
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-do', label: 'What we do' },
  { id: 'how-we-work', label: 'How we work' },
  { id: 'principles', label: 'Principles' },
  { id: 'founder', label: 'Founder note' },
  { id: 'data-use', label: 'AI & Data' },
  { id: 'trust-documents', label: 'Trust & Legal' },
  { id: 'contact', label: 'Contact' },
];

export const AboutPage: React.FC<AboutPageProps> = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }

      // Check section in view
      const sectionElements = SECTIONS.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      }));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const item = sectionElements[i];
        if (item.el) {
          const rect = item.el.getBoundingClientRect();
          if (rect.top <= 240) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Mobile Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-cyan-400 z-50 origin-left transition-transform duration-75 lg:hidden"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* =====================================================================
              DESKTOP LEFT RAIL (Sticky Progress & Navigation)
              ===================================================================== */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start pr-4 space-y-6">
            <div className="flex items-center gap-3 pb-2">
              <img 
                src="/logo.png" 
                alt="CoreIQ Create" 
                className="w-7 h-7 object-contain rounded"
              />
              <span className="font-mono text-xs tracking-wider text-cyan-400 font-medium uppercase">
                CoreIQ Create
              </span>
            </div>

            <nav aria-label="Page sections" className="space-y-1.5 border-l border-slate-800 pl-3">
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`block w-full text-left text-xs font-mono py-1 transition-colors cursor-pointer focus:outline-none focus:text-cyan-300 ${
                      isActive
                        ? 'text-cyan-300 font-semibold -ml-[13px] pl-[12px] border-l-2 border-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Location
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Johannesburg, Gauteng<br />South Africa
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/27810397758?text=YES%20-%20Free%20Homepage%20Rebuild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>+27 81 039 7758</span>
                </a>
              </div>
            </div>
          </aside>

          {/* =====================================================================
              MAIN READING COLUMN (Right 9 Cols)
              ===================================================================== */}
          <main className="lg:col-span-9 space-y-20 sm:space-y-28 max-w-3xl">

            {/* 1. HERO */}
            <section id="hero" className="space-y-6 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/60 text-xs font-mono text-cyan-400 tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                About CoreIQ Create
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.08]">
                A small team that builds useful things for real businesses.
              </h1>

              <p className="text-slate-300 text-lg sm:text-xl leading-relaxed font-sans">
                CoreIQ Create is a founder-led studio in Johannesburg. We build websites, business apps, automation and AI assistants, using AI to do more with a small team, and we tell you plainly what we can and can't do.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="https://wa.me/27810397758?text=YES%20-%20Free%20Homepage%20Rebuild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors min-h-[44px] shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                >
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span>Get your free homepage rebuild</span>
                </a>
                <button
                  type="button"
                  onClick={() => scrollTo('how-we-work')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-200 transition-colors min-h-[44px] cursor-pointer"
                >
                  <span>Read how we work</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </section>

            {/* 2. WHO WE ARE */}
            <section id="who-we-are" className="space-y-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                01 / Who we are
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                Founder-led, based in Johannesburg.
              </h2>
              <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed font-sans">
                <p>
                  We are a small, founder-led, AI-supported studio based in Johannesburg, Gauteng. We work with businesses across Gauteng and throughout Southern Africa that need digital tools that actually work for their day-to-day operations.
                </p>
                <p>
                  AI tools help us design interfaces, draft code, and test scenarios much faster than an old-fashioned agency could with a large staff. But every architectural decision, every line of delivered code, and every client conversation is handled and reviewed directly by a person.
                </p>
              </div>
            </section>

            {/* 3. WHAT WE DO, AND WHAT WE DON'T */}
            <section id="what-we-do" className="space-y-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                02 / Capabilities & Boundaries
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                What we do, and what we don't.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {/* DO COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                      <Check className="w-3 h-3" />
                    </span>
                    <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                      What we do
                    </h3>
                  </div>
                  <ul className="space-y-3.5 text-slate-300 text-sm sm:text-base leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 mt-1 font-mono text-xs">01</span>
                      <span>
                        <strong className="text-white font-semibold">Websites:</strong> Built to load quickly on a mobile phone and turn visitors into phone calls, bookings, and direct WhatsApp messages.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 mt-1 font-mono text-xs">02</span>
                      <span>
                        <strong className="text-white font-semibold">Business apps:</strong> Booking calendars, instant quoting calculators, intake portals, and client-facing web applications.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 mt-1 font-mono text-xs">03</span>
                      <span>
                        <strong className="text-white font-semibold">Automation:</strong> Eliminating repetitive copy-and-paste tasks between your WhatsApp, email, forms, and spreadsheets.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 mt-1 font-mono text-xs">04</span>
                      <span>
                        <strong className="text-white font-semibold">AI assistants:</strong> WhatsApp and website assistants to handle routine questions, qualify leads, and book consultations.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* DON'T COLUMN (Honest limits) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300">
                      <X className="w-3 h-3" />
                    </span>
                    <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                      What we don't do (honest limits)
                    </h3>
                  </div>
                  <ul className="space-y-3.5 text-slate-300 text-sm sm:text-base leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-slate-500 mt-1 font-mono text-xs">--</span>
                      <span>
                        We don't promise search ranking guarantees, traffic spikes, or revenue figures.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-slate-500 mt-1 font-mono text-xs">--</span>
                      <span>
                        We don't replace your staff, your relationships with your clients, or your business judgment.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-slate-500 mt-1 font-mono text-xs">--</span>
                      <span>
                        We don't build systems we cannot support after launch, and we will state so openly before you pay.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-slate-500 mt-1 font-mono text-xs">--</span>
                      <span>
                        AI assistants never pretend to be human and hand over directly to a person when a customer query needs one.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Note */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-sm">
                <span className="text-cyan-400 font-mono text-xs mr-2 uppercase tracking-wider">Note:</span>
                Not sure which one you need? Tell us the problem and we'll say which of these fits, or that none do.
              </div>
            </section>

            {/* 4. HOW WE WORK */}
            <section id="how-we-work" className="space-y-8 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                03 / Process & Engagements
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                How we work.
              </h2>

              {/* Horizontal Scrollable Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  The delivery sequence (scroll horizontally)
                </div>
                <div className="overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-4 min-w-[760px]">
                    {TIMELINE_STEPS.map((step, idx) => (
                      <div
                        key={step.name}
                        className="flex-1 min-w-[140px] p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-cyan-400 font-bold">
                            0{idx + 1}
                          </span>
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <span className="text-slate-600 font-mono text-xs">→</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white font-display">
                          {step.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {step.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* How a project starts */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-xl font-bold text-white font-display">
                  How a project starts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PROJECT_START_STEPS.map((item) => (
                    <div
                      key={item.number}
                      className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 space-y-1.5"
                    >
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {item.number}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {item.step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Three Build Sizes Table (quiet, no prices) */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-xl font-bold text-white font-display">
                  Build options
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 font-mono text-xs text-slate-400 uppercase">
                        <th className="py-3 pr-4 font-semibold">Tier</th>
                        <th className="py-3 px-4 font-semibold">Scope</th>
                        <th className="py-3 px-4 font-semibold">Revisions</th>
                        <th className="py-3 pl-4 font-semibold">Structure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {BUILD_SIZES.map((tier) => (
                        <tr key={tier.name} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 pr-4 font-semibold text-white whitespace-nowrap">
                            {tier.name}
                          </td>
                          <td className="py-4 px-4 text-slate-300 leading-relaxed">
                            {tier.scope}
                          </td>
                          <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                            {tier.revisions}
                          </td>
                          <td className="py-4 pl-4 font-mono text-xs text-cyan-300 whitespace-nowrap">
                            {tier.pricingType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 5. OUR PRINCIPLES */}
            <section id="principles" className="space-y-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                04 / Principles
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                How we make decisions.
              </h2>

              <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
                {PRINCIPLES.map((principle) => (
                  <div key={principle.title} className="py-5 sm:py-6 space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                      {principle.title}
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                      {principle.sentence}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. FOUNDER NOTE */}
            <section id="founder" className="space-y-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                05 / Founder note
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                From the founder.
              </h2>

              <blockquote className="space-y-6">
                <p className="text-xl sm:text-2xl text-slate-200 font-display leading-relaxed border-l-2 border-cyan-400 pl-6 italic">
                  "For the past two years I have immersed myself in large language models, agent systems, software development and automation. Before that I spent more than ten years selling to businesses across Southern Africa, so I know what a website has to do to earn its keep."
                </p>

                {/* 
                  SLOT: Place real founder photograph here when available.
                  Do not render fake avatar or stock placeholder.
                */}

                <div className="pl-6 space-y-0.5">
                  <div className="text-base font-bold text-white">
                    Desmond Mashele
                  </div>
                  <div className="text-sm font-mono text-slate-400">
                    Founder, CoreIQ Create
                  </div>
                </div>
              </blockquote>
            </section>

            {/* 7. HOW WE USE AI AND YOUR DATA */}
            <section id="data-use" className="space-y-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                06 / Data & Privacy
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
                How we use AI and your data.
              </h2>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                <p>
                  We believe in plain disclosures without hidden small print. Here is exactly what our code does when you interact with this website:
                </p>

                <ul className="space-y-3 pl-4 border-l border-slate-800">
                  <li className="space-y-1">
                    <strong className="text-white block font-semibold">
                      Ask CoreIQ is an AI assistant, not a person.
                    </strong>
                    <span className="text-slate-400 text-sm block">
                      When you use the Ask CoreIQ bar or Ask page, you are communicating with an automated neural language model, not a human operator.
                    </span>
                  </li>

                  <li className="space-y-1">
                    <strong className="text-white block font-semibold">
                      Messages are sent to third-party AI model providers.
                    </strong>
                    <span className="text-slate-400 text-sm block">
                      Prompts and conversation history are forwarded to external model API providers (such as Groq or Google Gemini) to generate responses.
                    </span>
                  </li>

                  <li className="space-y-1">
                    <strong className="text-white block font-semibold">
                      Conversations can be saved as enquiries.
                    </strong>
                    <span className="text-slate-400 text-sm block">
                      When an interaction is substantive, message summaries may be saved to our Supabase database to allow us to review and respond to project enquiries.
                    </span>
                  </li>

                  <li className="space-y-1">
                    <strong className="text-white block font-semibold">
                      A memory service may store conversation snippets.
                    </strong>
                    <span className="text-slate-400 text-sm block">
                      Our system connects with Mem0 to retain brief conversational context across sessions so you do not have to repeat yourself.
                    </span>
                  </li>
                </ul>

                <p className="text-slate-400 text-sm">
                  {/* TODO: expand data retention & deletion policies in Privacy Policy once formal review completes */}
                  Full details regarding data retention and deletion will be set out in our forthcoming Privacy Policy.
                </p>

                <p className="pt-2 text-sm text-slate-300 font-medium">
                  Questions about your data? Email{' '}
                  <a 
                    href="mailto:coreiqcreate@gmail.com" 
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    coreiqcreate@gmail.com
                  </a>.
                </p>
              </div>
            </section>

            {/* 8. TRUST & LEGAL (Light Surface Panel) */}
            <section id="trust-documents" className="pt-4">
              <div className="rounded-2xl bg-[#f8fafc] text-slate-900 p-6 sm:p-10 shadow-xl space-y-6">
                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <span className="text-xs font-mono tracking-widest text-slate-500 uppercase block font-semibold">
                    07 / Transparency
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
                    Trust and documents.
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                    We're publishing our legal documents in stages. Until they're live, ask us anything and we'll answer in writing.
                  </p>
                </div>

                {/* Document List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LEGAL_DOCUMENTS.map((doc) => {
                    const isLive = doc.status === 'live' && doc.href;
                    if (isLive) {
                      return (
                        <a
                          key={doc.title}
                          href={doc.href}
                          className="p-3.5 rounded-xl border border-slate-300 bg-white hover:border-slate-400 flex items-center justify-between text-slate-900 text-sm font-medium transition-colors"
                        >
                          <span>{doc.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-500" />
                        </a>
                      );
                    }

                    return (
                      <div
                        key={doc.title}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-between text-slate-500 text-sm select-none"
                      >
                        <span className="font-medium text-slate-700">{doc.title}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600 tracking-wide">
                          In preparation
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-200">
                  <p>
                    These documents are being prepared for review by a qualified lawyer.
                    {/* TODO: Add POPIA, PAIA and Information Officer registrations once formal legal review completes */}
                  </p>
                </div>
              </div>
            </section>

            {/* 9. CONTACT (Closing) */}
            <section id="contact" className="space-y-8 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">
                08 / Direct communication
              </span>

              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
                  Talk to a person.
                </h2>
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                  Reply YES with your website address and we'll start your free homepage rebuild.
                </p>
              </div>

              {/* Direct Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="https://wa.me/27810397758?text=YES%20-%20Free%20Homepage%20Rebuild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors min-h-[44px] shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                >
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span>WhatsApp: +27 81 039 7758</span>
                </a>
                <a
                  href="mailto:coreiqcreate@gmail.com?subject=Free%20Homepage%20Rebuild"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm border border-slate-700 hover:border-slate-500 bg-slate-900/60 text-slate-200 transition-colors min-h-[44px]"
                >
                  <Mail className="w-4 h-4 text-slate-300" />
                  <span>Email: coreiqcreate@gmail.com</span>
                </a>
              </div>

              {/* Verified links & presence */}
              <div className="pt-6 border-t border-slate-800/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <a
                    href="https://coreiqcreate-ten.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-cyan-300 hover:border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>Website: coreiqcreate-ten.vercel.app</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <a
                    href="https://linkedin.com/company/coreiq-create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-cyan-300 hover:border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>LinkedIn: CoreIQ Create</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <a
                    href="https://youtube.com/@coreiqcreate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-cyan-300 hover:border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>YouTube: @coreiqcreate</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <a
                    href="https://facebook.com/coreiqcreate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-cyan-300 hover:border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>Facebook: CoreIQ Create</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>

                <div className="pt-2 text-xs font-mono text-slate-500">
                  CoreIQ Create · Johannesburg, Gauteng, South Africa
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
