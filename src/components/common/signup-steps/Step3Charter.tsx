import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step3CharterProps {
  onNext: () => void;
  entryMode?: 'standard' | 'oauth-completion';
  key?: string;
}

export default function Step3Charter({ onNext, entryMode = 'standard' }: Step3CharterProps) {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current && !scrolledToBottom) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 25) {
        setScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight <= clientHeight) {
        setScrolledToBottom(true);
      }
    }
  }, []);

  return (
    <motion.section 
      variants={pageVariants} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center w-full px-2 h-full justify-between"
    >
      <div className="text-center w-full">
        {entryMode === 'oauth-completion' && (
          <p className="font-sans text-stone-500 text-sm mb-2">Welcome back — one quick step before we set up your account.</p>
        )}
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-1 tracking-tight">Terms of Use</h2>
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-4 select-none">≈ 5 minutes</p>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-md border border-stone-200/90 bg-stone-50/60 p-6 md:p-8 flex flex-col overflow-y-auto rounded-sm maroon-scrollbar" 
        style={{ maxHeight: '200px' }}
      >
        <div className="text-stone-600 font-sans leading-relaxed text-sm text-justify space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">1. Introduction</h3>
            <p className="mb-2 font-normal">Welcome to Adjung.</p>
            <p className="mb-2 font-normal">Adjung is an editorial publishing platform dedicated to the creation, preservation, and dissemination of knowledge. By creating an account or accessing any part of the platform, you agree to comply with these Terms of Use.</p>
            <p className="font-normal">These Terms govern your use of Adjung and all related services.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">2. Eligibility</h3>
            <p className="mb-2 font-normal">You must be legally capable of entering into a binding agreement under the laws applicable in your jurisdiction.</p>
            <p className="font-normal">If you register on behalf of an organization, you confirm that you are authorized to do so.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">3. Membership</h3>
            <p className="mb-2 font-normal">Creating an account establishes your membership in Adjung.</p>
            <p className="mb-2 font-normal">Membership grants access to features according to your account privileges and participation within the platform.</p>
            <p className="font-normal">Certain privileges, including eligibility for a Personal Site, may require additional participation requirements determined by Adjung.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">4. User Identity</h3>
            <p className="mb-2 font-normal">Members are responsible for maintaining accurate account information.</p>
            <p className="mb-2 font-normal">You may publish under a Pen Name.</p>
            <p className="font-normal">However, Adjung reserves the right to request identity verification where necessary to protect platform integrity.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">5. Intellectual Property</h3>
            <p className="mb-2 font-normal">You retain ownership of the works you publish.</p>
            <p className="mb-2 font-normal">By publishing content on Adjung, you grant Adjung a non-exclusive licence to display, archive, index, preserve, and distribute your published works within the platform.</p>
            <p className="font-normal">Adjung does not claim ownership of your intellectual property.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">6. Publication Standards</h3>
            <p className="mb-2 font-normal">Members agree that published content should:</p>
            <ul className="list-disc pl-5 mb-2 font-normal space-y-1">
              <li>be original or properly attributed;</li>
              <li>respect copyright;</li>
              <li>avoid plagiarism;</li>
              <li>avoid impersonation;</li>
              <li>avoid fraudulent or misleading information;</li>
              <li>comply with applicable laws.</li>
            </ul>
            <p className="font-normal">Adjung may remove or restrict content that violates these standards.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">7. Artificial Intelligence</h3>
            <p className="mb-2 font-normal">Members may use artificial intelligence tools during the creation of their works.</p>
            <p className="mb-2 font-normal">Where required by Adjung policies, AI-assisted content should be appropriately disclosed.</p>
            <p className="font-normal">Members remain fully responsible for everything published under their names.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">8. Personal Site</h3>
            <p className="mb-2 font-normal">Eligible members may establish a Personal Site under an Adjung subdomain.</p>
            <p className="mb-2 font-normal">Eligibility requirements are determined by Adjung and may change over time.</p>
            <p className="font-normal">A Personal Site remains subject to these Terms of Use.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">9. Privacy</h3>
            <p className="mb-2 font-normal">Adjung collects only the information necessary to operate the platform.</p>
            <p className="font-normal">Personal information will be handled in accordance with the Adjung Privacy Policy.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">10. Account Security</h3>
            <p className="mb-2 font-normal">Members are responsible for maintaining the confidentiality of their login credentials.</p>
            <p className="font-normal">Notify Adjung immediately if unauthorized access is suspected.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">11. Suspension and Termination</h3>
            <p className="mb-2 font-normal">Adjung may suspend or terminate accounts that:</p>
            <ul className="list-disc pl-5 mb-2 font-normal space-y-1">
              <li>violate these Terms;</li>
              <li>repeatedly breach publication standards;</li>
              <li>threaten platform integrity;</li>
              <li>engage in unlawful activities.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">12. Amendments</h3>
            <p className="mb-2 font-normal">These Terms may be updated from time to time.</p>
            <p className="mb-2 font-normal">Material changes will be communicated through appropriate platform notices.</p>
            <p className="font-normal">Continued use of Adjung constitutes acceptance of the revised Terms.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">13. Governing Law</h3>
            <p className="font-normal">These Terms shall be governed by the laws applicable to the operator of Adjung unless otherwise required by mandatory local law.</p>
          </div>
          
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900 mb-2">14. Contact</h3>
            <p className="font-normal">Questions regarding these Terms may be directed through the official contact channels published by Adjung.</p>
          </div>

          {scrolledToBottom && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center text-adjung-maroon font-sans text-xs font-normal mt-6 pt-4 border-t border-stone-200"
            >
              You have reached the end of the Adjung Terms of Use.
            </motion.p>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl mt-6 flex flex-col items-center select-none">
        <label className={`flex items-start gap-3 mb-6 ${scrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} max-w-md`}>
          <input 
            type="checkbox" 
            disabled={!scrolledToBottom}
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            className="w-4 h-4 accent-adjung-maroon mt-0.5 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="text-stone-600 text-[13px] font-sans select-none leading-relaxed">
            I have read and agree to the Terms of Use.
            {!scrolledToBottom && (
              <span className="block text-[10px] text-stone-400 font-mono mt-1 uppercase tracking-wide">
                Please scroll to the bottom of the Terms of Use to enable
              </span>
            )}
          </span>
        </label>

        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-6 select-none">
          Also see our{' '}
          <a href="/policies" target="_blank" rel="noopener noreferrer" className="text-adjung-maroon hover:underline">
            Community Guidelines
          </a>
        </p>

        <button
          disabled={!agreed || !scrolledToBottom}
          onClick={onNext} 
          className={`px-10 py-3 border font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm font-bold ${
            agreed && scrolledToBottom
              ? 'bg-stone-800 hover:bg-stone-900 text-[#FDFDFD] cursor-pointer shadow-sm'
              : 'border-stone-200 text-stone-400 cursor-not-allowed bg-transparent'
          }`}
        >
          Accept & Continue
        </button>
      </div>
    </motion.section>
  );
}
