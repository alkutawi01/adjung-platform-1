import React from 'react';

interface Step6BiographyProps {
  formData: any;
  setFormData: (data: any) => void;
}

// Headless subsection consumed by Step6PublicProfile — no own heading/footer,
// the parent step provides one shared Continue button for the whole profile.
export default function Step6Biography({ formData, setFormData }: Step6BiographyProps) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">Biography (optional)</label>
      <textarea
        rows={4}
        value={formData.biography}
        onChange={e => setFormData({...formData, biography: e.target.value})}
        className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2.5 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-sans leading-relaxed placeholder:italic placeholder:text-stone-400/60"
        placeholder="Tell readers a little about yourself. You can always edit this later."
      ></textarea>
    </div>
  );
}
