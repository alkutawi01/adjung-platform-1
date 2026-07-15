import React from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step2PhilosophyProps {
  onNext: () => void;
  key?: string;
}

export default function Step2Philosophy({ onNext }: Step2PhilosophyProps) {
  return (
    <motion.section 
      variants={pageVariants} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center w-full h-full justify-between py-1"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-4 tracking-tight">The Philosophy</h2>
      </div>
      <div className="space-y-4 text-stone-600 leading-relaxed mb-6 font-serif text-[14.5px] max-w-md border-l-2 border-adjung-maroon/20 pl-6 flex-1 flex flex-col justify-center">
        <p className="font-normal">Adjung values knowledge over popularity. Every work published here is meant to endure beyond the moment of its creation.</p>
        <p className="font-normal">We honour human authorship. Every word carries the weight of its author's intellectual commitment.</p>
        <p className="font-normal">Editorial integrity is paramount. We do not optimise for engagement—we optimise for truth and clarity.</p>
        <p className="font-normal">Long-term preservation is our promise. What you write here becomes part of an enduring record.</p>
        <p className="font-normal">Respectful discourse is expected. Adjung is a place for serious intellectual exchange.</p>
      </div>
      <button 
        onClick={onNext} 
        className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
      >
        Continue
      </button>
    </motion.section>
  );
}
