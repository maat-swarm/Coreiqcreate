import React, { useState } from 'react';

export const NewsNewsletter: React.FC = () => {
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setEmailSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="border border-white/[0.14] bg-[#080d1a] p-5 rounded-[2px]">
      <span className="news-mono text-[#19d9ff] text-[10px] block mb-1.5 font-semibold">
        COREIQ INTELLIGENCE DISPATCH
      </span>
      <h3 className="news-serif text-[20px] leading-tight text-[#f4f1ea] font-normal mb-2">
        Get the signals before they become consensus.
      </h3>
      <p className="text-xs text-[#9aa3b2] leading-relaxed mb-4 font-sans">
        Every Friday: high-signal architectural breakdowns, benchmark stress tests, and verified model releases. No sponsored filler.
      </p>

      {emailSubscribed ? (
        <div className="p-3 border border-[#19d9ff]/30 bg-[#19d9ff]/10 text-[#19d9ff] text-xs flex items-center gap-2 rounded-[2px]">
          <span className="text-sm font-bold">✓</span>
          <span>You are subscribed to The CoreIQ Weekly. Welcome to the frontier.</span>
        </div>
      ) : (
        <form onSubmit={handleNewsletterSubmit} className="space-y-3">
          <input
            type="email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="name@company.com"
            required
            aria-label="Your work email address"
            className="w-full h-[44px] px-3.5 bg-[#06080d] border border-white/[0.14] text-[#f4f1ea] placeholder-[#9aa3b2]/60 text-xs rounded-[2px] news-focus focus:border-[#19d9ff] font-sans"
          />
          <button
            type="submit"
            className="w-full h-[44px] px-4 bg-[#19d9ff] hover:bg-[#5ce1e6] active:bg-[#19d9ff] text-[#06080d] font-semibold text-xs tracking-wider uppercase rounded-[2px] news-focus transition-none cursor-pointer"
          >
            Subscribe Free
          </button>
        </form>
      )}
    </div>
  );
};
