import React from 'react';
import { CoreIQLogo } from './CoreIQLogo';
import { NavRoute } from '../../types';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: NavRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#020511] border-t border-slate-800/80 text-slate-400 text-sm relative overflow-hidden">
      {/* Subtle top atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <a 
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }} 
              className="inline-block cursor-pointer focus:outline-none"
            >
              <CoreIQLogo size="lg" />
            </a>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              CoreIQ is an intelligent creation environment. We connect ideas with intelligence and action to help you build software, autonomous agents, and scalable automations.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 tracking-wider uppercase font-semibold">
              <span>Ideas</span>
              <span>•</span>
              <span>Intelligence</span>
              <span>•</span>
              <span>Action</span>
            </div>
          </div>

          {/* Column 1: Ecosystem */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm tracking-wide">Ecosystem</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="/services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('services');
                  }} 
                  className="hover:text-cyan-300 transition-colors font-medium text-cyan-200/90 inline-block"
                >
                  Services & Solutions
                </a>
              </li>
              <li>
                <a 
                  href="/use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('use-cases');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Use Cases
                </a>
              </li>
              <li>
                <a 
                  href="/apps"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('apps');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Applications
                </a>
              </li>
              <li>
                <a 
                  href="/tools"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('tools');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Tool Library
                </a>
              </li>
              <li>
                <a 
                  href="/learn"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('learn');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Learn & Intelligence
                </a>
              </li>
              <li>
                <a 
                  href="/news"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('news');
                  }} 
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>AI News & Signals</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Capabilities */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm tracking-wide">Capabilities</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="/use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('use-cases');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  AI Agents
                </a>
              </li>
              <li>
                <a 
                  href="/use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('use-cases');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Workflow Automation
                </a>
              </li>
              <li>
                <a 
                  href="/use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('use-cases');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Web & Native Apps
                </a>
              </li>
              <li>
                <a 
                  href="/use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('use-cases');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Voice AI Interfaces
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Creation */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm tracking-wide">Creation</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="/ask"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('ask');
                  }} 
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask CoreIQ</span>
                </a>
              </li>
              <li>
                <a 
                  href="/command"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('command');
                  }} 
                  className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition-colors font-mono text-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>CoreIQ Command</span>
                </a>
              </li>
              <li>
                <a 
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('about');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  About Philosophy
                </a>
              </li>
              <li>
                <a 
                  href="/tools"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('tools');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  Writing Assistant
                </a>
              </li>
              <li>
                <a 
                  href="/apps"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('apps');
                  }} 
                  className="hover:text-cyan-300 transition-colors inline-block"
                >
                  ImageForge Studio
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider & copyright */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} CoreIQ Create. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Intelligent Creation Environment</span>
            <span>•</span>
            <a 
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('about');
              }} 
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Core Principles
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
