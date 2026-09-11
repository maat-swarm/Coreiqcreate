import React, { useState, useRef } from 'react';
import { Sparkles, Zap, LayoutGrid, GraduationCap, ArrowRight, Cpu, Layers, Monitor, CheckCircle2, Loader2, Search, Link as LinkIcon } from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CoreIQMark3D } from '../components/common/CoreIQMark3D';
import { NavRoute } from '../types';

const BackgroundLayers = () => (
  <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
    <video
      autoPlay muted loop playsInline
      style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.4,pointerEvents:'none'}}
    >
      <source src="/hero-bg.mp4" type="video/mp4" />
    </video>
  </div>
);
