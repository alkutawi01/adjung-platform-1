import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemSettings } from '../../types';
import { parseResearchFindings } from '../../utils';

interface PhilosophyCarouselProps {
  systemSettings: SystemSettings;
  researchFindingsGoogleDocText?: string;
}

export function PhilosophyCarousel({
  systemSettings,
  researchFindingsGoogleDocText = ''
}: PhilosophyCarouselProps) {
  const [index, setIndex] = useState(0);

  const findingsList = React.useMemo(() => {
    const { items: customFindingsText } = parseResearchFindings(systemSettings.researchFindingsText || '');
    const { items: customFindingsGoogle } = parseResearchFindings(researchFindingsGoogleDocText || '');
    const allCustomFindings = [...customFindingsText, ...customFindingsGoogle];

    // Shown only until a Chief Editor curates real findings via Editorium's
    // "Research Findings & Deep Reading Digest" field (systemSettings.
    // researchFindingsText / researchFindingsGoogleDocUrl, both wired above).
    // These were previously three specific claims attributed to named
    // journals/institutions that don't actually exist — verified via web
    // search, none of them are real, findable publications. Replaced with
    // unattributed statements of the platform's own philosophy instead of
    // inventing more fake citations.
    const fallbacks = [
      { finding: "Knowledge that endures is written slowly, and read even more slowly.", source: "" },
      { finding: "A note read once and forgotten was never really read at all.", source: "" },
      { finding: "The most valuable ideas rarely arrive first. They arrive intact.", source: "" }
    ];

    return allCustomFindings.length > 0 ? allCustomFindings : fallbacks;
  }, [systemSettings.researchFindingsText, researchFindingsGoogleDocText]);

  useEffect(() => {
    if (findingsList.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % findingsList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [findingsList.length]);

  const activeFinding = findingsList[index] || { finding: '', source: '' };

  return (
    <div className="w-full flex items-center justify-center h-[140px] md:h-[110px] overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center justify-center px-4 md:px-8 py-2 text-center space-y-1.5"
        >
          <p className="font-sans text-[#2D2D2D] text-[16px] md:text-[18px] leading-relaxed max-w-xl">
            "{activeFinding.finding}"
          </p>
          {activeFinding.source && (
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#555555]">
              — {activeFinding.source}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
