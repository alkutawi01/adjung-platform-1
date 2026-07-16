import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SystemSettings } from '../../../types';

interface PlatformIdentityTabProps {
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  enableArabicAccent: boolean;
  setEnableArabicAccent: (val: boolean) => void;
  announcementBanner: string;
  setAnnouncementBanner: (banner: string) => void;
  layoutDensity: 'Standard' | 'Compact' | 'Classical';
  setLayoutDensity: (density: 'Standard' | 'Compact' | 'Classical') => void;
  hasPermission: (perm: string) => boolean;
}

export function PlatformIdentityTab({
  systemSettings,
  setSystemSettings,
  enableArabicAccent,
  setEnableArabicAccent,
  announcementBanner,
  setAnnouncementBanner,
  layoutDensity,
  setLayoutDensity,
  hasPermission
}: PlatformIdentityTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#FDFDFD] border border-stone-200 rounded p-6 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-3 text-left select-none">
          <h3 className="font-serif text-lg font-semibold text-stone-950">Platform Identity & Configuration</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Configure global press branding, frontpage styling, and metadata settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          {/* Academic Affiliation */}
          <div className="space-y-4 text-left">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Academic Affiliation</label>
              <input
                type="text"
                value={systemSettings.academicAffiliation}
                disabled={!hasPermission('manageSettings')}
                onChange={(e) => {
                  const updated = { ...systemSettings, academicAffiliation: e.target.value };
                  setSystemSettings(updated);
                }}
                className={`w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon text-xs ${
                  !hasPermission('manageSettings') ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : 'bg-white text-stone-900'
                }`}
              />
              <span className="text-stone-400 text-[9px] font-mono mt-1 block">Establishes the host educational institution displayed in footnotes and headers.</span>
            </div>

            {/* Accent Color Selection */}
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">System-Wide Accent Theme</label>
              <div className="flex items-center gap-3 select-none">
                <span className="w-4 h-4 rounded-full bg-adjung-maroon border border-adjung-maroon/20 inline-block" />
                <span className="font-mono text-stone-700 uppercase">Adjung Maroon (#802334)</span>
                <span className="text-stone-400 font-mono text-[9px] bg-stone-100 px-1.5 py-0.5 rounded ml-auto">ESTABLISHED BRAND</span>
              </div>
            </div>

            {/* Calligraphic tag checkbox */}
            <div className="pt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="arabic-accent-cb"
                  checked={enableArabicAccent}
                  onChange={(e) => setEnableArabicAccent(e.target.checked)}
                  className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="arabic-accent-cb" className="font-mono text-[10px] uppercase tracking-wider text-stone-600 font-semibold cursor-pointer">
                    Enable Calligraphic Script Tag Seals
                  </label>
                  <span className="text-stone-400 text-[9px] font-mono block mt-0.5 leading-normal">
                    Highlights Arabic, Ottoman Turkish, or Jawi script publications with beautiful calligraphic tag stamps on the Frontpage.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Frontpage settings */}
          <div className="space-y-4 text-left">
            {/* Banner text */}
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Header Announcement Banner Text</label>
              <textarea
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                className="w-full border border-stone-200 p-2.5 rounded bg-white text-xs leading-relaxed focus:outline-none focus:border-adjung-maroon min-h-[70px] text-stone-850"
                placeholder="Enter welcome or alert text displayed on the Frontpage..."
              />
              <span className="text-stone-400 text-[9px] font-mono mt-1 block">Renders a high-density banner at the top of the Frontpage for general announcements.</span>
            </div>

            {/* Layout density slider/buttons */}
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Frontpage Grid Layout Density</span>
              <div className="flex items-center gap-2">
                {(['Standard', 'Compact', 'Classical'] as const).map(density => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => setLayoutDensity(density)}
                    className={`px-3 py-1.5 font-mono text-[10px] rounded transition cursor-pointer select-none ${
                      layoutDensity === density
                        ? 'bg-adjung-maroon text-white font-bold shadow-sm'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {density} Grid
                  </button>
                ))}
              </div>
              <span className="text-stone-400 text-[9px] font-mono mt-1.5 block">Alters card spacing, margin parameters, and typographic scaling of the home scriptorium feed.</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Block */}
        <div className="w-full bg-stone-50 border border-stone-200 p-4 rounded text-xs text-stone-600 leading-normal font-serif flex items-start gap-2.5 text-left select-none">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Brand Status: Active & Operational.</strong> Changes to the academic affiliation or tag seals are written directly to the platform database and synchronized across all open browser context views.
          </div>
        </div>
      </div>
    </div>
  );
}
