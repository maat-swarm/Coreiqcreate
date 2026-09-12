import React, { useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from 'motion/react';
import type { MotionValue } from 'motion/react';
import {
  Sparkles,
  Zap,
  LayoutGrid,
  GraduationCap,
  ArrowRight,
  Cpu,
  Layers,
  Monitor,
  CheckCircle2,
  Loader2,
  Search,
  Link as LinkIcon,
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { NavRoute } from '../types';

interface HomePageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

type Accent = 'cyan' | 'indigo' | 'blue' | 'purple' | 'pink' | 'emerald';

const ACCENT_GLOW: Record<Accent, string> = {
  cyan: 'rgba(34,211,238,0.55)',
  indigo: 'rgba(129,140,248,0.55)',
  blue: 'rgba(59,130,246,0.55)',
  purple: 'rgba(168,85,247,0.55)',
  pink: 'rgba(236,72,153,0.55)',
  emerald: 'rgba(52,211,153,0.55)',
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ---------------------------------------------------------------------------
// Capability Strip Tile — entrance is driven by shared scroll progress, and
// selecting a tile fires a visible "activation" flash before navigating.
// ---------------------------------------------------------------------------
interface CapabilityTileProps {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
  hoverTextColor: string;
  accent: Accent;
  progress: MotionValue<number>;
  index: number;
  total: number;
  onSelect: () => void;
}

const CapabilityTile: React.FC<CapabilityTileProps> = ({
  icon: Icon,
  label,
  description,
  gradient,
  borderColor,
  iconColor,
  hoverTextColor,
  accent,
  progress,
  index,
  total,
  onSelect,
}) => {
  const [activated, setActivated] = useState(false);
  const start = (index / total) * 0.55;
  const end = start + 0.45;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [34, 0]);
  const scale = useTransform(progress, [start, end], [0.94, 1]);

  const handleClick = () => {
    setActivated(true);
    window.setTimeout(() => {
      onSelect();
      setActivated(false);
    }, 240);
  };

  return (
    <motion.div
      style={{ opacity, y, scale }}
      onClick={handleClick}
      animate={activated ? { scale: 1.05 } : { scale: 1 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className="group relative cursor-pointer p-4 rounded-2xl border border-transparent hover:border-cyan-500/20 transition-colors duration-300"
    >
      <AnimatePresence>
        {activated && (
          <motion.span
            initial={{ opacity: 0.65, scale: 0.92 }}
            animate={{ opacity: 0, scale: 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `0 0 0 1px ${ACCENT_GLOW[accent]}, 0 0 34px ${ACCENT_GLOW[accent]}` }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={activated ? { backgroundColor: 'rgba(15,23,42,0.55)' } : { backgroundColor: 'rgba(15,23,42,0)' }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 rounded-2xl -z-10 group-hover:bg-slate-900/40"
      />
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} border ${borderColor} flex items-center justify-center mb-4 transition-transform duration-300 ${
          activated ? 'scale-110' : 'group-hover:scale-105'
        }`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className={`text-white font-semibold text-base mb-1.5 transition-colors group-hover:${hoverTextColor}`}>
        {label}
      </h3>
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Explore Card — 3D tilt-in entrance driven by scroll, plus a click
// activation pulse before navigating away.
// ---------------------------------------------------------------------------
interface ExploreCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  hoverTextColor: string;
  accent: Accent;
  progress: MotionValue<number>;
  index: number;
  total: number;
  onSelect: () => void;
}

const ExploreCard: React.FC<ExploreCardProps> = ({
  icon: Icon,
  label,
  description,
  iconBg,
  iconBorder,
  iconColor,
  hoverTextColor,
  accent,
  progress,
  index,
  total,
  onSelect,
}) => {
  const [activated, setActivated] = useState(false);
  const start = (index / total) * 0.6;
  const end = start + 0.4;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [50, 0]);
  const rotateX = useTransform(progress, [start, end], [10, 0]);

  const handleClick = () => {
    setActivated(true);
    window.setTimeout(() => {
      onSelect();
      setActivated(false);
    }, 240);
  };

  return (
    <motion.div
      style={{ opacity, y, rotateX, transformPerspective: 800 }}
      onClick={handleClick}
      animate={activated ? { scale: 1.04 } : { scale: 1 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className="group relative cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
    >
      <AnimatePresence>
        {activated && (
          <motion.span
            initial={{ opacity: 0.7, scale: 0.94 }}
            animate={{ opacity: 0, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `0 0 0 1px ${ACCENT_GLOW[accent]}, 0 0 40px ${ACCENT_GLOW[accent]}` }}
          />
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} border ${iconBorder} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <ArrowRight
          className={`w-4 h-4 text-slate-500 transition-all ${
            activated ? `${hoverTextColor} translate-x-1` : `group-hover:${hoverTextColor} group-hover:translate-x-1`
          }`}
        />
      </div>
      <div>
        <h3 className={`text-white font-bold text-lg mb-1 transition-colors group-hover:${hoverTextColor}`}>
          {label}
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Process node status, driven purely by scroll progress (see activeNode).
// ---------------------------------------------------------------------------
type NodeAccent = 'cyan' | 'purple' | 'indigo';

const NODE_STYLES: Record<NodeAccent, { active: string; done: string; icon: string; iconDone: string; text: string; dot: string; dotDone: string }> = {
  cyan: {
    active: 'border-cyan-400/60 bg-cyan-950/50 shadow-[0_0_24px_rgba(34,211,238,0.3)]',
    done: 'border-cyan-500/25 bg-slate-900/60',
    icon: 'text-cyan-300',
    iconDone: 'text-cyan-400',
    text: 'text-cyan-100',
    dot: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    dotDone: 'bg-cyan-500/70',
  },
  purple: {
    active: 'border-purple-400/60 bg-purple-950/50 shadow-[0_0_24px_rgba(168,85,247,0.3)]',
    done: 'border-purple-500/25 bg-slate-900/60',
    icon: 'text-purple-300',
    iconDone: 'text-purple-400',
    text: 'text-purple-100',
    dot: 'bg-purple-400 shadow-[0_0_8px_#c084fc]',
    dotDone: 'bg-purple-500/70',
  },
  indigo: {
    active: 'border-indigo-400/60 bg-indigo-950/50 shadow-[0_0_24px_rgba(129,140,248,0.3)]',
    done: 'border-indigo-500/25 bg-slate-900/60',
    icon: 'text-indigo-300',
    iconDone: 'text-indigo-400',
    text: 'text-indigo-100',
    dot: 'bg-indigo-400 shadow-[0_0_8px_#818cf8]',
    dotDone: 'bg-indigo-500/70',
  },
};

const PENDING_CARD = 'border-slate-700/30 bg-slate-900/40';

const PROCESS_NODES: { label: string; icon: React.ElementType; accent: NodeAccent; spin: boolean }[] = [
  { label: 'Analysing your needs...', icon: Loader2, accent: 'cyan', spin: true },
  { label: 'Finding the best solution...', icon: Search, accent: 'purple', spin: false },
  { label: 'Connecting your tools...', icon: LinkIcon, accent: 'indigo', spin: false },
  { label: 'Building your system...', icon: CheckCircle2, accent: 'cyan', spin: false },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAsk }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0, active: false });

  // Cursor-reactive energy field for the phoenix core — smoothed with a
  // spring so the light trails the pointer instead of snapping to it.
  const cursorX = useMotionValue(50);
  const cursorY = useMotionValue(50);
  const springX = useSpring(cursorX, { stiffness: 90, damping: 18, mass: 0.6 });
  const springY = useSpring(cursorY, { stiffness: 90, damping: 18, mass: 0.6 });
  const fieldX = useTransform(springX, (v) => `${v}%`);
  const fieldY = useTransform(springY, (v) => `${v}%`);

  const homePills = [
    { label: 'Build a website', query: 'I need a modern website' },
    { label: 'Automate my business', query: 'I want to automate my business workflows' },
    { label: 'Create an app', query: 'I want to build a custom web app' },
    { label: 'Explore solutions', query: 'What solutions does Core IQ offer?' },
  ];

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setHeroTilt({ x, y, active: true });
    cursorX.set(((e.clientX - rect.left) / rect.width) * 100);
    cursorY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0, active: false });
    cursorX.set(50);
    cursorY.set(50);
  };

  const tiltMagnitude = Math.min(1, Math.sqrt(heroTilt.x * heroTilt.x + heroTilt.y * heroTilt.y));

  // ---- Hero exit choreography: the hero recedes, parallaxing at two
  // different depths, as the user scrolls past it. ----
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(heroProgress, [0, 0.65, 1], [1, 0.55, 0]);
  const heroLeftY = useTransform(heroProgress, [0, 1], [0, -90]);
  const heroRightY = useTransform(heroProgress, [0, 1], [0, -40]);
  const heroRightScale = useTransform(heroProgress, [0, 1], [1, 1.08]);

  // ---- Capability strip: staggered rise driven by scroll into view. ----
  const { scrollYProgress: stripProgress } = useScroll({ target: stripRef, offset: ['start 0.92', 'start 0.4'] });

  // ---- Process section: scroll progress cascades node activation. ----
  const { scrollYProgress: processProgress } = useScroll({ target: processRef, offset: ['start 0.75', 'start 0.1'] });
  const [activeNode, setActiveNode] = useState(0);
  useMotionValueEvent(processProgress, 'change', (latest) => {
    const clamped = Math.min(1, Math.max(0, latest));
    setActiveNode(Math.min(3, Math.floor(clamped * 4)));
  });
  const intentFillWidth = useTransform(processProgress, [0, 1], ['18%', '100%']);
  const flowOpacity = useTransform(processProgress, [0, 1], [0.22, 0.6]);

  // ---- Banner: parallaxing cosmic backdrop + headline reveal. ----
  const { scrollYProgress: bannerProgress } = useScroll({ target: bannerRef, offset: ['start end', 'end start'] });
  const bannerImageY = useTransform(bannerProgress, [0, 1], ['-12%', '12%']);
  const bannerHeadlineX = useTransform(bannerProgress, [0, 0.45], [-28, 0]);
  const bannerHeadlineOpacity = useTransform(bannerProgress, [0, 0.4], [0, 1]);
  const underlineScale = useTransform(bannerProgress, [0.05, 0.45], [0, 1]);

  // ---- Explore cards: tilt-in staggered by scroll. ----
  const { scrollYProgress: exploreProgress } = useScroll({ target: exploreRef, offset: ['start 0.9', 'start 0.35'] });

  const capabilities: {
    icon: React.ElementType;
    label: string;
    description: string;
    gradient: string;
    borderColor: string;
    iconColor: string;
    hoverTextColor: string;
    accent: Accent;
    route: NavRoute;
  }[] = [
    {
      icon: Sparkles,
      label: 'AI Agents',
      description: 'Specialised agents working together to get real results.',
      gradient: 'from-cyan-500/20 to-blue-600/20',
      borderColor: 'border-cyan-400/30',
      iconColor: 'text-cyan-400',
      hoverTextColor: 'text-cyan-300',
      accent: 'cyan',
      route: 'solutions',
    },
    {
      icon: Cpu,
      label: 'Integrations',
      description: 'Connect your tools, data and systems effortlessly.',
      gradient: 'from-indigo-500/20 to-purple-600/20',
      borderColor: 'border-indigo-400/30',
      iconColor: 'text-indigo-400',
      hoverTextColor: 'text-indigo-300',
      accent: 'indigo',
      route: 'solutions',
    },
    {
      icon: Zap,
      label: 'Automation',
      description: 'Remove the busy work and focus on what matters.',
      gradient: 'from-blue-500/20 to-cyan-600/20',
      borderColor: 'border-blue-400/30',
      iconColor: 'text-blue-400',
      hoverTextColor: 'text-blue-300',
      accent: 'blue',
      route: 'solutions',
    },
    {
      icon: LayoutGrid,
      label: 'Apps & Websites',
      description: 'Custom solutions built for your unique needs.',
      gradient: 'from-purple-500/20 to-pink-600/20',
      borderColor: 'border-purple-400/30',
      iconColor: 'text-purple-400',
      hoverTextColor: 'text-purple-300',
      accent: 'purple',
      route: 'apps',
    },
    {
      icon: GraduationCap,
      label: 'Learn & Grow',
      description: 'Build your skills with courses, guides and more.',
      gradient: 'from-pink-500/20 to-rose-600/20',
      borderColor: 'border-pink-400/30',
      iconColor: 'text-pink-400',
      hoverTextColor: 'text-pink-300',
      accent: 'pink',
      route: 'learn',
    },
  ];

  const exploreCards: {
    icon: React.ElementType;
    label: string;
    description: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    hoverTextColor: string;
    accent: Accent;
    route: NavRoute;
  }[] = [
    {
      icon: Sparkles,
      label: 'AI Agents',
      description: 'Custom agents for your business needs.',
      iconBg: 'bg-cyan-500/15',
      iconBorder: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      hoverTextColor: 'text-cyan-300',
      accent: 'cyan',
      route: 'solutions',
    },
    {
      icon: Zap,
      label: 'Automation',
      description: 'Streamline workflows and save time.',
      iconBg: 'bg-blue-500/15',
      iconBorder: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      hoverTextColor: 'text-blue-300',
      accent: 'blue',
      route: 'solutions',
    },
    {
      icon: LayoutGrid,
      label: 'Apps',
      description: 'Powerful apps, built for your vision.',
      iconBg: 'bg-purple-500/15',
      iconBorder: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      hoverTextColor: 'text-purple-300',
      accent: 'purple',
      route: 'apps',
    },
    {
      icon: Monitor,
      label: 'Websites',
      description: 'Modern, scalable web experiences.',
      iconBg: 'bg-emerald-500/15',
      iconBorder: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      hoverTextColor: 'text-emerald-300',
      accent: 'emerald',
      route: 'apps',
    },
    {
      icon: Layers,
      label: 'Integrations',
      description: 'Connect everything in your ecosystem.',
      iconBg: 'bg-indigo-500/15',
      iconBorder: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      hoverTextColor: 'text-indigo-300',
      accent: 'indigo',
      route: 'solutions',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative min-h-screen flex items-center pt-24 pb-16 lg:py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content Column */}
            <motion.div
              style={{ opacity: heroOpacity, y: heroLeftY }}
              className="lg:col-span-6 space-y-7 z-10"
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                  IDEAS + INTELLIGENCE + ACTION
                </span>
              </div>

              {/* Massive Headline */}
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Build what <br />
                <span className="gradient-text-phoenix">matters.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal max-w-xl leading-relaxed">
                Core IQ is your AI partner for building, automating and scaling what's next. Describe your vision and let's create it — together.
              </p>

              {/* Ask Core IQ Input Bar */}
              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask Core IQ anything..."
                  pills={homePills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>

              {/* Scroll to explore */}
              <div className="pt-8 flex items-center gap-3 text-xs tracking-widest text-slate-500 uppercase font-medium">
                <span className="w-8 h-[1px] bg-slate-700" />
                <span>SCROLL TO EXPLORE</span>
              </div>
            </motion.div>

            {/* Right Visual Column: The Iconic Core IQ Phoenix Energy Core with 3D Parallax & Depth */}
            <motion.div
              style={{ opacity: heroOpacity, y: heroRightY, scale: heroRightScale }}
              className="lg:col-span-6 relative flex justify-center items-center select-none"
            >
              <div className="relative w-full flex justify-center items-center" style={{ perspective: '1000px' }}>
                {/* Floating metadata badge with spatial parallax */}
                <div
                  className="absolute -top-6 right-2 sm:right-6 z-20 text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-cyan-300/80 uppercase text-right transition-transform duration-500 ease-out"
                  style={{
                    transform: heroTilt.active
                      ? `translate3d(${heroTilt.x * -16}px, ${heroTilt.y * -14}px, 25px)`
                      : 'translate3d(0, 0, 0)',
                  }}
                >
                  <div className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">INTELLIGENCE</div>
                  <div>THAT BUILDS</div>
                  <div>WITH YOU</div>
                </div>

                {/* The Glowing Energy Core Phoenix Visual with 3D Tilt */}
                <div
                  className="relative w-full max-w-[620px] aspect-square flex items-center justify-center transition-transform duration-500 ease-out"
                  style={{
                    transform: heroTilt.active
                      ? `rotateY(${heroTilt.x * 8}deg) rotateX(${heroTilt.y * -8}deg) translateZ(10px)`
                      : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Cursor-reactive energy field — a live light source that follows the
                      pointer, distinct from the ambient tilt below. */}
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen"
                    style={
                      {
                        background:
                          'radial-gradient(480px circle at var(--ex) var(--ey), rgba(34,211,238,0.45), rgba(168,85,247,0.18) 45%, transparent 72%)',
                        opacity: heroTilt.active ? 1 : 0,
                        transition: 'opacity 0.4s ease-out',
                        // Custom properties driven by spring-smoothed motion values;
                        // `as any` because CSSProperties has no typed slot for CSS vars.
                        '--ex': fieldX,
                        '--ey': fieldY,
                      } as any
                    }
                  />

                  {/* Multi-layered ambient glows behind the core with differential parallax.
                      Opacity brightens with cursor movement magnitude — a direct,
                      cause-and-effect response beyond the base tilt. */}
                  <div
                    className="absolute inset-0 rounded-full bg-cyan-500/30 blur-[100px] animate-pulse-glow transition-transform duration-700 ease-out"
                    style={{
                      transform: heroTilt.active ? `translate(${heroTilt.x * 20}px, ${heroTilt.y * 20}px)` : 'none',
                      opacity: heroTilt.active ? 0.55 + tiltMagnitude * 0.35 : undefined,
                    }}
                  />
                  <div
                    className="absolute inset-10 rounded-full bg-purple-600/30 blur-[80px] transition-transform duration-1000 ease-out"
                    style={{
                      transform: heroTilt.active ? `translate(${heroTilt.x * -15}px, ${heroTilt.y * -15}px)` : 'none',
                    }}
                  />
                  <div className="absolute inset-20 rounded-full bg-pink-500/20 blur-[60px]" />

                  {/* Floating ambient orbital particles around the Phoenix Core */}
                  <div className="absolute top-[8%] left-[12%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-particle-1 pointer-events-none" />
                  <div className="absolute bottom-[10%] right-[16%] w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899] animate-particle-2 pointer-events-none" />
                  <div className="absolute top-[45%] -right-2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] animate-particle-3 pointer-events-none" />
                  <div className="absolute top-[20%] right-[8%] w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-particle-2 pointer-events-none" />
                  <div className="absolute bottom-[24%] left-[6%] w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-particle-3 pointer-events-none" />

                  {/* Core IQ Phoenix Energy Core Image — displayed large and uncropped */}
                  <div className="relative w-full h-full animate-float-slow">
                    <img
                      src="/logo.png"
                      alt="Core IQ Phoenix Energy Core"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain object-center drop-shadow-[0_0_45px_rgba(6,182,212,0.4)] transform hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. CAPABILITY STRIP (5 PILLARS) */}
      <section ref={stripRef} className="border-y border-slate-800/60 bg-[#04091a]/60 backdrop-blur-md py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {capabilities.map((cap, i) => (
              <CapabilityTile
                key={cap.label}
                icon={cap.icon}
                label={cap.label}
                description={cap.description}
                gradient={cap.gradient}
                borderColor={cap.borderColor}
                iconColor={cap.iconColor}
                hoverTextColor={cap.hoverTextColor}
                accent={cap.accent}
                progress={stripProgress}
                index={i}
                total={capabilities.length}
                onSelect={() => onNavigate(cap.route)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. THE CORE IQ PROCESS ("From idea to reality") */}
      <section ref={processRef} className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Description */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                THE CORE IQ PROCESS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                From idea to reality
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                You bring the vision. Core IQ handles the rest — analysing, planning, integrating and building with the power of AI, automation and the swarm.
              </p>
              <div>
                <button
                  onClick={() => onNavigate('solutions')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-200"
                >
                  <span>See how it works</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Connected Flow Visualization */}
            <div className="lg:col-span-7 relative">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#060c22] to-slate-950 border border-cyan-500/25 shadow-[0_0_60px_rgba(6,182,212,0.18)] overflow-hidden">
                {/* Luminous background wave lines — brighten as the process progresses */}
                <motion.div style={{ opacity: flowOpacity }} className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 500 350" fill="none">
                    <path
                      d="M 50 180 C 150 100, 300 260, 450 160"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      className="animate-flow-dash"
                    />
                    <path
                      d="M 50 200 C 180 280, 280 80, 450 180"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      opacity="0.8"
                      className="animate-reverse-flow-dash"
                    />
                  </svg>
                </motion.div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                  {/* Left: Input Intent Card */}
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/35 shadow-xl space-y-3.5 transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                        CoreIQ Intent
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-white text-sm font-medium leading-relaxed">
                      "I want to automate my customer support process."
                    </p>
                    {/* Progress fill tied directly to scroll — the "build" advances as you scroll */}
                    <div className="pt-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          style={{ width: intentFillWidth }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Connected Progression Nodes — activate in sequence as you scroll */}
                  <div className="space-y-3">
                    {PROCESS_NODES.map((node, i) => {
                      const status: 'pending' | 'active' | 'done' = i < activeNode ? 'done' : i === activeNode ? 'active' : 'pending';
                      const style = NODE_STYLES[node.accent];
                      const Icon = status === 'done' ? CheckCircle2 : node.icon;
                      return (
                        <motion.div
                          key={node.label}
                          animate={{ scale: status === 'active' ? 1.02 : 1 }}
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-500 ease-out ${
                            status === 'pending' ? PENDING_CARD : status === 'active' ? style.active : style.done
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 transition-colors duration-500 ${
                                status === 'pending'
                                  ? 'text-slate-600'
                                  : status === 'active'
                                  ? `${style.icon} ${node.spin ? 'animate-spin' : ''}`
                                  : style.iconDone
                              }`}
                            />
                            <span
                              className={`text-xs sm:text-sm transition-colors duration-500 ${
                                status === 'pending' ? 'text-slate-500' : status === 'active' ? `${style.text} font-medium` : 'text-slate-300'
                              }`}
                            >
                              {node.label}
                            </span>
                          </div>
                          <motion.span
                            animate={
                              status === 'active'
                                ? { scale: [1, 1.6, 1], opacity: [1, 0.45, 1] }
                                : { scale: 1, opacity: status === 'pending' ? 0.25 : 0.8 }
                            }
                            transition={status === 'active' ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
                            className={`w-2 h-2 rounded-full ${
                              status === 'pending' ? 'bg-slate-600' : status === 'active' ? style.dot : style.dotDone
                            }`}
                          />
                        </motion.div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BANNER: MORE THAN A WEBSITE ("It's an intelligent creation environment.") */}
      <section ref={bannerRef} className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 p-8 sm:p-12 lg:p-16 bg-gradient-to-r from-[#071330] via-[#0b102b] to-[#040817]">
          {/* Cosmic backdrop light — parallaxes against the foreground copy while scrolling */}
          <motion.div
            style={{ y: bannerImageY }}
            className="absolute right-0 -top-[10%] -bottom-[10%] h-[120%] w-1/2 opacity-30 pointer-events-none"
          >
            <img
              src={ASSETS.cosmicHorizon}
              alt="Cosmic Horizon"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-right"
            />
          </motion.div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              style={{ opacity: bannerHeadlineOpacity, x: bannerHeadlineX }}
              className="lg:col-span-7 space-y-3"
            >
              <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                MORE THAN A WEBSITE
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
                It's an intelligent <br />
                creation environment.
              </h3>
              <motion.div
                style={{ scaleX: underlineScale, transformOrigin: 'left' }}
                className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-4"
              />
            </motion.div>

            <div className="lg:col-span-5 space-y-5">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Core IQ isn't just a website — it's a living, evolving platform where ideas become solutions, powered by AI, the swarm and a universe of integrations.
              </p>
              <button
                onClick={() => onNavigate('solutions')}
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold group transition-colors"
              >
                <span>Explore Core IQ</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPLORE CORE IQ ("What would you like to create?") */}
      <section ref={exploreRef} className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              EXPLORE CORE IQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mt-2">
              What would you like to create?
            </h2>
          </div>
          <button
            onClick={() => onNavigate('solutions')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <span>View all solutions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {exploreCards.map((card, i) => (
            <ExploreCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              description={card.description}
              iconBg={card.iconBg}
              iconBorder={card.iconBorder}
              iconColor={card.iconColor}
              hoverTextColor={card.hoverTextColor}
              accent={card.accent}
              progress={exploreProgress}
              index={i}
              total={exploreCards.length}
              onSelect={() => onNavigate(card.route)}
            />
          ))}
        </div>
      </section>
    </div>
    </MotionConfig>
  );
};
