import React, { useState, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { RESERVED_PATHS } from '../../../config/reservedPaths';

interface Step7PersonalSiteProps {
  formData: any;
  setFormData: (data: any) => void;
}

// Headless subsection consumed by Step6PublicProfile — no own heading/footer.
export default function Step7PersonalSite({ formData, setFormData }: Step7PersonalSiteProps) {
  const { users } = useAppContext();
  const [status, setStatus] = useState<'idle'|'loading'|'available'|'invalid'|'reserved'|'taken'>('idle');
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
      const lower = val.toLowerCase();
      if (RESERVED_PATHS.includes(lower)) {
        setStatus('reserved');
      } else if (users.some(u => u.username.toLowerCase() === lower)) {
        setStatus('taken');
      } else {
        setStatus('available');
      }
    }, 500);
  };

  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">Personal site address (optional)</label>

      <div className="bg-stone-50 border border-stone-200/90 p-4 rounded-sm w-full text-center mb-3 select-none">
        <p className="font-sans text-lg text-stone-800 tracking-tight">
          <span className={formData.domain ? 'text-adjung-maroon font-semibold' : 'text-stone-400/90'}>
            {formData.domain || 'yourname'}
          </span>
          <span className="text-stone-400 font-light">.adjung.com</span>
        </p>
      </div>

      <div className="relative">
        <div className="flex items-baseline bg-transparent border-b-2 border-stone-200/60 pb-1.5 focus-within:border-adjung-maroon transition-all">
          <input
            type="text"
            placeholder="alex"
            value={formData.domain}
            onChange={(e) => checkDomain(e.target.value)}
            className="flex-1 bg-transparent font-sans text-base text-stone-900 focus:outline-none placeholder:text-stone-300 min-w-0"
          />
          <span className="font-sans text-sm text-stone-400 ml-1 select-none">.adjung.com</span>
        </div>

        <div className="h-[2px] bg-adjung-maroon absolute bottom-0 left-0 transition-all duration-700" style={{ width: status === 'loading' ? '100%' : '0%', opacity: status === 'loading' ? 1 : 0 }} />

        <p className="text-xs mt-2 h-4 transition-opacity duration-300 font-sans font-normal" style={{ opacity: status !== 'idle' && status !== 'loading' ? 1 : 0, color: status === 'available' ? '#44403C' : '#9A3412' }}>
          {status === 'invalid' && 'Contains invalid characters'}
          {status === 'reserved' && 'This address is reserved'}
          {status === 'taken' && 'This address is already taken'}
          {status === 'available' && '✓ This address is available'}
        </p>
      </div>

      <p className="text-[11px] text-stone-400 mt-2 font-sans">
        Skip for now — you'll get a temporary address you can change later.
      </p>
    </div>
  );
}
