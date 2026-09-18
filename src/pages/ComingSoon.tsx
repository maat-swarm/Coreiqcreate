import React from 'react';
import { motion } from 'motion/react';
import { CoreIQLogo } from '../components/common/CoreIQLogo';
import { GradientBorderBox } from '../components/ask/GradientBorderBox';

export interface ComingSoonProps {
  title: string;
  description: string;
  onNavigate?: (route: string) => void;
}

export function ComingSoon({ title, description, onNavigate }: ComingSoonProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -16 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
      style={{
        minHeight: '100svh',
        background: '#080808',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <CoreIQLogo />
      </div>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <GradientBorderBox radius={18}>
          <div style={{ padding: '40px 32px' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: '#00e676',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 12,
              }}
            >
              IN DEVELOPMENT
            </span>
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                marginBottom: 12,
                color: '#fff',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              {description}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a
                href="/ask"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('ask');
                  }
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-block',
                  cursor: 'pointer',
                }}
              >
                Ask CoreIQ →
              </a>
              <a
                href="/"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('home');
                  }
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-block',
                  cursor: 'pointer',
                }}
              >
                Home
              </a>
            </div>
          </div>
        </GradientBorderBox>
      </div>
    </motion.div>
  );
}

export default ComingSoon;

