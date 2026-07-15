import React from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step6BiographyProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  key?: string;
}

export default function Step6Biography({ formData, setFormData, onNext }: Step6BiographyProps) {
  const handleSkip = () => {
    setFormData({ ...formData, biography: '' });
    onNext();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.section 
      variants={pageVariants} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center w-full py-1 h-full justify-between"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-2 tracking-tight">About You</h2>
        <p className="text-stone-500 text-center text-xs mb-6 max-w-xs mx-auto leading-relaxed font-sans select-none">
          This is a short description of yourself, your intellectual background, or interests that will be displayed on your Personal Site.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md font-sans">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">Description (optional)</label>
          <textarea 
            rows={5} 
            value={formData.biography}
            onChange={e => setFormData({...formData, biography: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2.5 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-serif leading-relaxed placeholder:italic placeholder:text-stone-400/60"
            placeholder="e.g. Researching ethics, epistemic integrity, and classical Islamic scholarship."
          ></textarea>
        </div>

        <div className="pt-2 flex gap-3">
          <button 
            type="button"
            onClick={handleSkip}
            className="flex-1 py-3 border border-stone-200 text-stone-500 hover:bg-stone-50 font-mono text-xs tracking-wider uppercase transition-all duration-300 rounded-sm font-semibold cursor-pointer text-center"
          >
            Skip
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-wider uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
          >
            Continue
          </button>
        </div>
      </form>
    </motion.section>
  );
}
