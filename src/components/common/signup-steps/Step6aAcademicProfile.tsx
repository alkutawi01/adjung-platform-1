import React from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step6aAcademicProfileProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  key?: string;
}

export default function Step6aAcademicProfile({ formData, setFormData, onNext }: Step6aAcademicProfileProps) {
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
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-2 tracking-tight">Academic Profile</h2>
        <p className="text-stone-500 text-center text-xs mb-6 max-w-xs mx-auto leading-relaxed font-sans select-none">
          Provide your professional title, institution affiliation, and primary areas of interest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md font-sans flex-grow flex flex-col justify-center">
        <div className="relative group">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">Professional Title</label>
          <input 
            type="text" 
            value={formData.professionalTitle || ''}
            onChange={e => setFormData({...formData, professionalTitle: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-serif placeholder:italic placeholder:text-stone-400/60" 
            placeholder="e.g. Associate Professor, Independent Scholar"
          />
        </div>

        <div className="relative group">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">Institution / Affiliation</label>
          <input 
            type="text" 
            value={formData.institution || ''}
            onChange={e => setFormData({...formData, institution: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-serif placeholder:italic placeholder:text-stone-400/60" 
            placeholder="e.g. Universiti Kebangsaan Malaysia"
          />
        </div>

        <div className="relative group">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">Areas of Interest</label>
          <input 
            type="text" 
            value={formData.areasOfInterest || ''}
            onChange={e => setFormData({...formData, areasOfInterest: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-serif placeholder:italic placeholder:text-stone-400/60" 
            placeholder="e.g. History, Epistemology, Islamic Philosophy"
          />
        </div>

        <div className="pt-6 flex justify-center">
          <button 
            type="submit" 
            className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
          >
            Continue
          </button>
        </div>
      </form>
    </motion.section>
  );
}
