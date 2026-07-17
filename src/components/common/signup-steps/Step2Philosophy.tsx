import React, { useState } from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

const CARDS = [
  {
    title: 'Knowledge before popularity.',
    body: 'Every work published here is meant to endure beyond the moment of its creation, not chase attention.',
  },
  {
    title: 'No endless social media feed.',
    body: 'Instead, discover carefully selected publications and current developments.',
  },
  {
    title: 'Build your own public profile.',
    body: 'Publish whenever you’re ready — there’s no pressure to post on a schedule.',
  },
  {
    title: 'Your work remains yours.',
    body: 'We honour human authorship. Every word carries the weight of its author’s intellectual commitment.',
  },
];

interface Step2PhilosophyProps {
  onNext: () => void;
  key?: string;
}

export default function Step2Philosophy({ onNext }: Step2PhilosophyProps) {
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    if (i < 0 || i >= CARDS.length) return;
    setIndex(i);
  };

  return (
    <motion.section
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center w-full h-full justify-between py-1"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-6 tracking-tight">What makes Adjung different?</h2>
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-md px-2 overflow-hidden">
        <motion.div
          key={index}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goTo(index + 1);
            else if (info.offset.x > 60) goTo(index - 1);
          }}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white border border-stone-200/80 rounded-sm shadow-sm p-8 text-center cursor-grab active:cursor-grabbing select-none"
        >
          <p className="font-serif text-xl text-stone-900 font-normal mb-3 leading-snug">{CARDS[index].title}</p>
          <p className="font-sans text-sm text-stone-500 leading-relaxed">{CARDS[index].body}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-6 select-none">
        {CARDS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to card ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? 'w-5 bg-adjung-maroon' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
            }`}
          />
        ))}
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
