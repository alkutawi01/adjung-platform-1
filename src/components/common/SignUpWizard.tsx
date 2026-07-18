import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, X } from 'lucide-react';

import Step1Welcome from './signup-steps/Step1Welcome';
import Step2Philosophy from './signup-steps/Step2Philosophy';
import Step3Charter from './signup-steps/Step3Charter';
import Step4Identity from './signup-steps/Step4Identity';
import Step5Verification from './signup-steps/Step5Verification';
import Step6PublicProfile from './signup-steps/Step6PublicProfile';
import Step7Interests from './signup-steps/Step7Interests';
import Step9Complete from './signup-steps/Step9Complete';

// Step ids are stable identifiers into STEP_TITLES/the render switch below —
// the two flows below just choose which ids (and in what order) to visit.
const STANDARD_FLOW = [1, 2, 3, 4, 5, 6, 7, 8];
// Google already verifies the email and Welcome/Philosophy are skipped since
// the user already chose to sign in — completion starts at the Charter step.
const OAUTH_FLOW = [3, 4, 6, 7, 8];
const COMPLETE_STEP_ID = 8;

const STEP_TITLES: Record<number, string> = {
  1: 'Welcome',
  2: 'The Philosophy',
  3: 'Terms of Use',
  4: 'Your Account',
  5: 'Verification',
  6: 'Your Public Profile',
  7: 'Your Interests',
  8: 'Welcome to Adjung',
};

interface SignUpWizardProps {
  onClose: () => void;
  onComplete: (data: any) => void;
  entryMode?: 'standard' | 'oauth-completion';
  prefill?: { email?: string; displayName?: string };
}

export default function SignUpWizard({ onClose, onComplete, entryMode = 'standard', prefill }: SignUpWizardProps) {
  const flow = entryMode === 'oauth-completion' ? OAUTH_FLOW : STANDARD_FLOW;
  const [flowIndex, setFlowIndex] = useState(0);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [formData, setFormData] = useState({
    displayName: prefill?.displayName || '',
    penName: '',
    email: prefill?.email || '',
    password: '',
    biography: '',
    domain: '',
    signatureType: 'draw',
    signatureData: '',
    interests: [] as string[],
    preferredLanguages: [] as string[],
    preferredEdition: '',
  });

  const currentStepId = flow[flowIndex];

  const goNext = () => {
    const nextIndex = flowIndex + 1;
    if (nextIndex >= flow.length || isTransitioning) return;
    setIsTransitioning(true);
    setOverlayTitle(STEP_TITLES[flow[nextIndex]] || '');
    setShowOverlay(true);

    setTimeout(() => {
      setFlowIndex(nextIndex);
      setShowOverlay(false);
      setIsTransitioning(false);
    }, 900);
  };

  const goBack = () => {
    if (flowIndex > 0 && !isTransitioning) {
      setFlowIndex(flowIndex - 1);
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
                  GETTING STARTED
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentStepId !== COMPLETE_STEP_ID && !showOverlay && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-adjung-maroon transition-all duration-300 z-10 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer group"
            aria-label="Cancel account setup"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}

        {currentStepId !== COMPLETE_STEP_ID && (
          <div className="border-b border-stone-200/60 p-5 bg-[#FFFFFF] flex justify-between items-center select-none relative">
            <div className="flex items-center gap-3">
              {flowIndex > 0 && (
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
                  Getting Started
                </span>
                <span className="text-stone-300 font-light font-sans text-xs">|</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500 font-medium">
                  Step {flowIndex + 1} of {flow.length}
                </span>
              </div>
            </div>
            <div className="w-24 h-[1.5px] bg-stone-200/60 rounded-full overflow-hidden relative mr-8">
              <div
                className="h-full bg-adjung-maroon transition-all duration-300 ease-out"
                style={{ width: `${((flowIndex + 1) / flow.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 w-full flex items-center justify-center p-6 md:p-10 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {currentStepId === 1 && <Step1Welcome key="s1" onNext={goNext} />}
            {currentStepId === 2 && <Step2Philosophy key="s2" onNext={goNext} />}
            {currentStepId === 3 && <Step3Charter key="s3" onNext={goNext} entryMode={entryMode} />}
            {currentStepId === 4 && <Step4Identity key="s4" formData={formData} setFormData={setFormData} onNext={goNext} entryMode={entryMode} />}
            {currentStepId === 5 && <Step5Verification key="s5" formData={formData} onNext={goNext} goBack={goBack} />}
            {currentStepId === 6 && <Step6PublicProfile key="s6" formData={formData} setFormData={setFormData} onNext={goNext} />}
            {currentStepId === 7 && <Step7Interests key="s7" formData={formData} setFormData={setFormData} onNext={goNext} />}
            {currentStepId === COMPLETE_STEP_ID && <Step9Complete key="s8" onComplete={handleComplete} />}
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}
