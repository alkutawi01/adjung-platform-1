import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step7PersonalSiteProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  key?: string;
}

export default function Step7PersonalSite({ formData, setFormData, onNext }: Step7PersonalSiteProps) {
  const [status, setStatus] = useState<'idle'|'loading'|'available'|'invalid'|'reserved'>('idle');
  const timeoutRef = useRef<any>(null);

  const checkDomain = (val: string) => {
    setFormData({...formData, domain: val});
    setStatus('idle');
    if (!val) return;
    
    if (!/^[a-z0-9\-]+$/i.test(val)) {
      setStatus('invalid');
      return;
    }
    
    setStatus('loading');
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const reserved = ['admin','adjung','support','help', 'www', 'blog'];
      if (reserved.includes(val.toLowerCase())) {
        setStatus('reserved');
      } else {
        setStatus('available');
      }
    }, 1000);
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
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-2 tracking-tight">Your Personal Site</h2>
        <p className="text-stone-500 text-center text-xs mb-6 max-w-md mx-auto leading-relaxed font-sans select-none">
          Every Personal Site represents a permanent intellectual address — the home of your Biography, Folio, Publications and intellectual legacy.
        </p>
      </div>
      
      <div className="bg-stone-50 border border-stone-200/80 p-5 rounded-sm w-full max-w-md text-center mb-4 shadow-sm select-none">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-1.5 font-bold">PROPOSED INTELLECTUAL DOMAIN</p>
        <p className="font-serif text-xl md:text-2xl text-stone-800 tracking-tight">
          <span className={formData.domain ? 'text-adjung-maroon font-semibold italic' : 'text-stone-400/80'}>
            {formData.domain || 'yourname'}
          </span>
          <span className="text-stone-400 font-light">.adjung.com</span>
        </p>
      </div>
      
      <p className="text-stone-500 text-[11.5px] text-center mb-4 max-w-xs leading-relaxed font-serif italic select-none font-normal">
        Permanent addresses are granted upon credential verification to preserve valuable namespaces.
      </p>

      <div className="w-full max-w-md mb-4 relative">
        <div className="flex items-baseline bg-transparent border-b-2 border-stone-200/60 pb-1.5 focus-within:border-adjung-maroon transition-all">
          <input 
            type="text" 
            placeholder="yourname" 
            value={formData.domain}
            onChange={(e) => checkDomain(e.target.value)}
            className="flex-1 bg-transparent font-serif text-lg text-stone-900 focus:outline-none placeholder:text-stone-300 min-w-0" 
          />
          <span className="font-serif text-base text-stone-400 ml-1 select-none">.adjung.com</span>
        </div>
        
        <div className="h-[2px] bg-adjung-maroon absolute bottom-0 left-0 transition-all duration-700" style={{ width: status === 'loading' ? '100%' : '0%', opacity: status === 'loading' ? 1 : 0 }} />
        
        <p className="text-xs mt-2 text-center h-4 transition-opacity duration-300 font-sans font-normal" style={{ opacity: status !== 'idle' && status !== 'loading' ? 1 : 0, color: status === 'available' ? '#44403C' : '#9A3412' }}>
          {status === 'invalid' && 'Contains invalid characters'}
          {status === 'reserved' && 'Already reserved by administration'}
          {status === 'available' && '✓ This address is available for request'}
        </p>
      </div>

      <AnimatePresence>
        {status === 'available' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full max-w-md text-center mb-4 overflow-hidden">
            <div className="pt-1 border border-stone-200 bg-white p-4 rounded-sm shadow-sm">
              <p className="font-serif text-sm text-stone-900 mb-1.5 font-semibold">Preferred Address Recorded</p>
              <p className="text-[11px] text-stone-500 leading-relaxed font-sans text-left font-normal">
                This domain is logged in your registration record. It will remain locked for your application during review.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={onNext} 
        className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
      >
        Continue
      </button>
    </motion.section>
  );
}
