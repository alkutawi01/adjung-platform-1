import React from 'react';
import { motion } from 'motion/react';
import Step6Biography from './Step6Biography';
import Step7PersonalSite from './Step7PersonalSite';
import Step8Signature from './Step8Signature';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step6PublicProfileProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  key?: string;
}

export default function Step6PublicProfile({ formData, setFormData, onNext }: Step6PublicProfileProps) {
  return (
    <motion.section
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center w-full py-1 h-full justify-between"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-1 tracking-tight">Your Public Profile</h2>
        <p className="text-stone-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed font-sans select-none font-normal">
          Everything here is optional and can always be changed later.
        </p>
      </div>

      <div className="w-full max-w-md flex-1 overflow-y-auto space-y-8 px-1">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-adjung-maroon/70 mb-3 font-bold">Biography</p>
          <Step6Biography formData={formData} setFormData={setFormData} />
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-adjung-maroon/70 mb-3 font-bold">Personal Site</p>
          <Step7PersonalSite formData={formData} setFormData={setFormData} />
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-adjung-maroon/70 mb-3 font-bold">Signature</p>
          <Step8Signature formData={formData} setFormData={setFormData} />
        </div>
      </div>

      <div className="w-full border-t border-stone-200 pt-4 mt-4 flex justify-end items-center bg-[#FFFFFF] select-none">
        <button
          onClick={onNext}
          className="px-10 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm font-bold bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] cursor-pointer shadow-sm"
        >
          Continue
        </button>
      </div>
    </motion.section>
  );
}
