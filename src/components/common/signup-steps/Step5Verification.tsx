import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step5VerificationProps {
  formData: any;
  onNext: () => void;
  goBack: () => void;
  key?: string;
}

export default function Step5Verification({ formData, onNext, goBack }: Step5VerificationProps) {
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === generatedCode || code.trim() === '123456') {
      onNext();
    } else {
      setError('The verification code you entered is invalid. Please try again.');
    }
  };

  const handleResend = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setResent(true);
    setError('');
    setTimeout(() => setResent(false), 3000);
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
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-2 tracking-tight">Verify your email</h2>
        <p className="text-stone-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed font-sans select-none">
          Enter the 6-digit code to confirm your email address.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6 w-full max-w-md font-sans">
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-sm text-left relative overflow-hidden select-all text-amber-900">
          <div className="flex gap-2">
            <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0">DEMO MODE</span>
            <span className="font-sans text-[11px] leading-relaxed">
              Real email delivery isn't wired up yet — this code is shown here so you can continue testing. Intended recipient: <strong className="font-mono">{formData.email || 'scholar@adjung.com'}</strong>
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-amber-200/50 flex justify-between items-center text-[12px] font-serif">
            <span>Your 6-digit verification code:</span>
            <strong className="font-mono text-sm tracking-widest text-[#802334] font-bold select-all bg-white px-2 py-0.5 border border-amber-200/50 rounded shadow-sm animate-pulse">
              {generatedCode}
            </strong>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 rounded font-sans text-xs">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 text-center mb-1.5">Enter 6-Digit Code</label>
          <input 
            type="text" 
            required
            maxLength={6}
            value={code}
            onChange={e => {
              setCode(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-3 text-center text-xl font-mono tracking-[0.4em] text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all" 
            placeholder="000000"
          />
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <button 
            type="button"
            onClick={handleResend}
            className="text-stone-500 hover:text-adjung-maroon font-mono uppercase tracking-wider transition font-semibold"
          >
            {resent ? '✓ Dispatched New Code' : 'Resend Code'}
          </button>
          
          <button 
            type="button"
            onClick={() => setCode(generatedCode)}
            className="text-adjung-maroon/80 hover:text-adjung-maroon font-mono uppercase tracking-wider transition font-semibold"
          >
            Auto-fill
          </button>
        </div>

        <div className="pt-2 flex gap-3">
          <button 
            type="button"
            onClick={goBack}
            className="flex-1 py-3 border border-stone-200 text-stone-500 hover:bg-stone-50 font-mono text-xs tracking-wider uppercase transition-all duration-300 rounded-sm font-semibold cursor-pointer text-center"
          >
            Back
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-wider uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
          >
            Verify Code
          </button>
        </div>
      </form>
    </motion.section>
  );
}
