import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step9CompleteProps {
  onComplete: () => void;
  key?: string;
}

export default function Step9Complete({ onComplete }: Step9CompleteProps) {
  const [showFinal, setShowFinal] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    const sequence = async () => {
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        setVisibleLines(prev => [...prev, i]);
      }
      
      await new Promise(r => setTimeout(r, 1500));
      setShowFinal(true);
    };
    sequence();
  }, []);

  return (
    <motion.section 
      variants={pageVariants} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center text-center w-full justify-center h-full min-h-[350px]"
    >
      <AnimatePresence>
        {!showFinal && (
          <motion.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }} className="flex flex-col gap-6 w-full items-center justify-center min-h-[250px] select-none">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: visibleLines.includes(0) ? 1 : 0, y: visibleLines.includes(0) ? 0 : 10 }} transition={{ duration: 0.8 }} className="font-serif text-xl text-stone-500 italic font-normal">Your account has been established.</motion.p>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: visibleLines.includes(1) ? 1 : 0, y: visibleLines.includes(1) ? 0 : 10 }} transition={{ duration: 0.8 }} className="font-serif text-xl text-stone-500 italic font-normal">Your intellectual identity has been created.</motion.p>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: visibleLines.includes(2) ? 1 : 0, y: visibleLines.includes(2) ? 0 : 10 }} transition={{ duration: 0.8 }} className="font-serif text-xl text-stone-500 italic font-normal">Adjung is ready for you.</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinal && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center min-h-[250px] justify-center">
            <div className="mb-6">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="mx-auto text-adjung-maroon">
                <rect x="10" y="6" width="28" height="36" rx="1.5" stroke="currentColor" strokeWidth="1.5"></rect>
                <line x1="16" y1="14" x2="32" y2="14" stroke="currentColor" strokeWidth="1.25"></line>
                <line x1="16" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.25"></line>
                <line x1="16" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.25"></line>
              </svg>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-stone-900 mb-3 tracking-tight">Welcome to Adjung.</h1>
            <p className="font-serif text-stone-500 italic text-sm mb-10 max-w-sm leading-relaxed font-normal">
              You can start reading immediately. Publishing tools are waiting whenever you're ready.
            </p>
            <button
              onClick={onComplete}
              className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
            >
              Enter Adjung
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.section>
  );
}
