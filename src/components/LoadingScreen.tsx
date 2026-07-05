import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BRAND } from '../config/brand';

export const LoadingScreen: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Gentle pulse animation props
  const pulseAnimate = shouldReduceMotion
    ? { opacity: 0.8 }
    : { opacity: [0.3, 0.8, 0.3] };

  const pulseTransition = shouldReduceMotion
    ? {}
    : { repeat: Infinity, duration: 1.8, ease: "easeInOut" };

  return (
    <div 
      id="Adjung-loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#802334] text-[#FDFDFD] transition-colors duration-300 select-none px-6"
    >
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        
        {/* 1. Official Adjung Logo */}
        <div className="flex items-center gap-2 select-none">
          <span className="font-serif text-3xl font-semibold tracking-wider text-[#FDFDFD]">
            {BRAND.logoText}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-200 border-l border-stone-200/50 pl-3">
            platform
          </span>
        </div>

        {/* 2. Official Tagline */}
        <p className="font-serif italic text-stone-100 text-[14px] md:text-[15px] tracking-wide select-none">
          {BRAND.tagline}
        </p>

        {/* 3. Minimal loading indicator */}
        <motion.div 
          animate={pulseAnimate}
          transition={pulseTransition}
          className="w-16 h-[1.5px] bg-[#FDFDFD]/80 mt-6 rounded-full"
          aria-label="Loading..."
        />
      </div>
    </div>
  );
};
