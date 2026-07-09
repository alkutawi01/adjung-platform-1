import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PHILOSOPHY_QUOTES = [
  "A realm where wisdom outshines mere appearance.",
  "Where every fragment of wisdom is given the reverence it deserves.",
  "Likes and shares often drown out reason and argument — but not here."
];

export function PhilosophyCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHILOSOPHY_QUOTES.length);
    }, 5000); // Comfortable reading pace (5 seconds)
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex items-center justify-center h-[100px] md:h-[80px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center justify-center px-4 md:px-8 py-2"
        >
          <p className="font-serif text-stone-600 text-[16px] md:text-[18px] leading-relaxed max-w-xl text-center">
            {PHILOSOPHY_QUOTES[index]}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
