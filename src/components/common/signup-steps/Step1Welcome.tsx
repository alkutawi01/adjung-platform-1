import React from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step1WelcomeProps {
  onNext: () => void;
  key?: string;
}

export default function Step1Welcome({ onNext }: Step1WelcomeProps) {
  return (
    <motion.section 
      variants={pageVariants} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center text-center w-full h-full justify-between select-none"
    >
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#111111] mb-4 tracking-tight leading-tight">Welcome to Adjung</h1>
        <p className="text-stone-500 text-base max-w-sm leading-relaxed font-serif italic font-normal">A place where knowledge is written to endure.</p>
      </div>
      
      <button 
        onClick={onNext} 
        className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
      >
        Start Now
      </button>
    </motion.section>
  );
}
