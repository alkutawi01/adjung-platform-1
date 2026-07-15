import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

import Step1Welcome from './signup-steps/Step1Welcome';
import Step2Philosophy from './signup-steps/Step2Philosophy';
import Step3Charter from './signup-steps/Step3Charter';
import Step4Identity from './signup-steps/Step4Identity';
import Step5Verification from './signup-steps/Step5Verification';
import Step6Biography from './signup-steps/Step6Biography';
import Step6aAcademicProfile from './signup-steps/Step6aAcademicProfile';
import Step7PersonalSite from './signup-steps/Step7PersonalSite';
import Step8Signature from './signup-steps/Step8Signature';
import Step9Complete from './signup-steps/Step9Complete';

const TOTAL_STEPS = 10;
const TITLES = [
  '',
  'Welcome',
  'The Philosophy',
  'Term of Use',
  'Your Identity',
  'Verification',
  'About You',
  'Academic Profile',
  'Your Personal Site',
  'Your Signature',
  'Welcome to Adjung'
];

interface SignUpWizardProps {
  onClose: () => void;
  onComplete: (data: any) => void;
}

export default function SignUpWizard({ onClose, onComplete }: SignUpWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayCount, setOverlayCount] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    penName: '',
    username: '',
    email: '',
    biography: '',
    professionalTitle: '',
    institution: '',
    areasOfInterest: '',
    domain: '',
    signatureType: 'draw',
    signatureData: ''
  });

  const goNext = (step: number) => {
    if (step < 1 || step > TOTAL_STEPS || isTransitioning) return;
    setIsTransitioning(true);
    
    setOverlayTitle(TITLES[step]);
    setOverlayCount(1);
    setShowOverlay(true);
    
    setTimeout(() => {
      setOverlayCount(2);
    }, 800);
    
    setTimeout(() => {
      setOverlayCount(3);
    }, 1400);

    setTimeout(() => {
      setCurrentStep(step);
      setShowOverlay(false);
      setIsTransitioning(false);
    }, 2000);
  };

  const goBack = () => {
    if (currentStep > 1 && !isTransitioning) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FFFFFF] border border-stone-200 shadow-2xl max-w-xl w-full h-[620px] max-h-[95vh] overflow-hidden scholarly-border flex flex-col relative my-4 text-stone-900 font-sans"
      >
        <AnimatePresence>
          {showOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 bg-adjung-maroon flex items-center justify-center flex-col text-center p-8 select-none"
            >
              <div className="space-y-4 max-w-md">
                <span className="block font-mono text-[9px] uppercase tracking-[0.35em] text-[#FDFBF7]/60 font-semibold">
                  SECTION {currentStep + 1} OF 10
                </span>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-serif text-3xl md:text-4xl text-[#FDFBF7] font-light flex items-start justify-center"
                >
                  {overlayTitle}
                </motion.h2>
                <div className="h-px w-16 bg-white/20 mx-auto my-3" />
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${overlayCount >= 1 ? 'bg-[#FDFBF7] scale-125' : 'bg-[#FDFBF7]/30'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${overlayCount >= 2 ? 'bg-[#FDFBF7] scale-125' : 'bg-[#FDFBF7]/30'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${overlayCount >= 3 ? 'bg-[#FDFBF7] scale-125' : 'bg-[#FDFBF7]/30'}`} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentStep < 10 && !showOverlay && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-adjung-maroon transition-all duration-300 z-40 p-1 cursor-pointer group"
            aria-label="Cancel registration"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {currentStep < 10 && (
          <div className="border-b border-stone-200/60 p-5 bg-[#FFFFFF] flex justify-between items-center select-none relative">
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mr-1 text-stone-400 hover:text-adjung-maroon transition-colors duration-300 flex items-center justify-center p-1 cursor-pointer group"
                  aria-label="Go back"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-adjung-maroon font-bold">
                  {String(currentStep).padStart(2, '0')} / 10
                </span>
                <span className="text-stone-300 font-light font-sans text-xs">|</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500 font-medium">
                  {TITLES[currentStep] || 'Registration'}
                </span>
              </div>
            </div>
            <div className="w-24 h-[1.5px] bg-stone-200/50 rounded-full overflow-hidden relative mr-8">
              <div 
                className="h-full bg-adjung-maroon transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 w-full flex items-center justify-center p-6 md:p-10 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {currentStep === 1 && <Step1Welcome key="s1" onNext={() => goNext(2)} />}
            {currentStep === 2 && <Step2Philosophy key="s2" onNext={() => goNext(3)} />}
            {currentStep === 3 && <Step3Charter key="s3" onNext={() => goNext(4)} />}
            {currentStep === 4 && <Step4Identity key="s4" formData={formData} setFormData={setFormData} onNext={() => goNext(5)} />}
            {currentStep === 5 && <Step5Verification key="s5v" formData={formData} onNext={() => goNext(6)} goBack={goBack} />}
            {currentStep === 6 && <Step6Biography key="s6" formData={formData} setFormData={setFormData} onNext={() => goNext(7)} />}
            {currentStep === 7 && <Step6aAcademicProfile key="s6a" formData={formData} setFormData={setFormData} onNext={() => goNext(8)} />}
            {currentStep === 8 && <Step7PersonalSite key="s7" formData={formData} setFormData={setFormData} onNext={() => goNext(9)} />}
            {currentStep === 9 && <Step8Signature key="s8" formData={formData} setFormData={setFormData} onNext={() => goNext(10)} />}
            {currentStep === 10 && <Step9Complete key="s9" onComplete={handleComplete} />}
          </AnimatePresence>
        </main>

        {currentStep < 10 && (
          <div className="border-t border-stone-200/40 py-3.5 bg-[#FFFFFF] flex justify-center items-center gap-2 select-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i}
                className={`transition-all duration-300 rounded-full ${
                  currentStep === i + 1 
                    ? 'w-4 h-1 bg-adjung-maroon' 
                    : 'w-1 h-1 bg-stone-300'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
