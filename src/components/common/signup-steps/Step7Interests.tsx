import React from 'react';
import { motion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

const TOPICS = [
  'Science', 'History', 'Technology', 'Business', 'Islamic Studies',
  'Literature', 'Education', 'Medicine', 'Design', 'Architecture',
  'Languages', 'Politics', 'Economics', 'Law', 'Art',
];

const LANGUAGES = ['English', 'Bahasa Melayu', 'العربية', 'Français', '日本語'];

// Illustrative editions only — no feature reads this field yet (see SPEC-028
// Composition Engine, deferred). Captured now so early signups aren't lost.
const EDITIONS = ['Global', 'Malaysia', 'Indonesia', 'Middle East', 'United Kingdom', 'Japan'];

const MAX_TOPICS = 5;

interface Step7InterestsProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  key?: string;
}

export default function Step7Interests({ formData, setFormData, onNext }: Step7InterestsProps) {
  const interests: string[] = formData.interests || [];
  const preferredLanguages: string[] = formData.preferredLanguages || [];

  const toggleTopic = (topic: string) => {
    const has = interests.includes(topic);
    if (has) {
      setFormData({ ...formData, interests: interests.filter(t => t !== topic) });
    } else if (interests.length < MAX_TOPICS) {
      setFormData({ ...formData, interests: [...interests, topic] });
    }
  };

  const toggleLanguage = (lang: string) => {
    const has = preferredLanguages.includes(lang);
    setFormData({
      ...formData,
      preferredLanguages: has ? preferredLanguages.filter(l => l !== lang) : [...preferredLanguages, lang]
    });
  };

  const canContinue = preferredLanguages.length > 0;

  return (
    <motion.section
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center w-full py-1 h-full justify-between"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-1 tracking-tight">Your Interests</h2>
        <p className="text-stone-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed font-sans select-none font-normal">
          Helps us shape what you see first. You can change this anytime.
        </p>
      </div>

      <div className="w-full max-w-md flex-1 overflow-y-auto space-y-7 px-1">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400">Topic Interests (optional)</label>
            <span className="text-[10px] font-mono text-stone-300">{interests.length}/{MAX_TOPICS}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(topic => {
              const active = interests.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  disabled={!active && interests.length >= MAX_TOPICS}
                  className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-all ${
                    active
                      ? 'bg-adjung-maroon border-adjung-maroon text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-adjung-maroon disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-2">Preferred Language(s)</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => {
              const active = preferredLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-all ${
                    active
                      ? 'bg-adjung-maroon border-adjung-maroon text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-adjung-maroon'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
          {preferredLanguages.length === 0 && (
            <p className="text-[11px] text-stone-400 mt-2 font-sans">Choose at least one.</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-2">Preferred Edition (optional)</label>
          <select
            value={formData.preferredEdition || ''}
            onChange={e => setFormData({ ...formData, preferredEdition: e.target.value })}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-serif"
          >
            <option value="">No preference</option>
            {EDITIONS.map(edition => (
              <option key={edition} value={edition}>{edition}</option>
            ))}
          </select>
          <p className="text-[11px] text-stone-400 mt-2 font-sans">
            Regional editions are on our roadmap — we're saving your preference for when they launch.
          </p>
        </div>
      </div>

      <div className="w-full border-t border-stone-150 pt-4 mt-4 flex justify-between items-center bg-[#FFFFFF] select-none">
        <span className="text-[11px] text-stone-400 font-serif italic font-normal">
          {canContinue ? '' : 'Choose at least one language to continue'}
        </span>
        <button
          disabled={!canContinue}
          onClick={onNext}
          className={`px-10 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm font-bold ${
            canContinue
              ? 'bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] cursor-pointer shadow-sm'
              : 'bg-stone-100 border border-stone-200 text-stone-300 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </motion.section>
  );
}
