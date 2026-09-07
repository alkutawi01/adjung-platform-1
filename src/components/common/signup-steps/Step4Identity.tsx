import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FieldTooltip } from '../FieldTooltip';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3 } }
};

interface Step4IdentityProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  entryMode?: 'standard' | 'oauth-completion';
  key?: string;
}

export default function Step4Identity({ formData, setFormData, onNext, entryMode = 'standard' }: Step4IdentityProps) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isOAuth = entryMode === 'oauth-completion';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOAuth) {
      if ((formData.password || '').length < 8) {
        setPasswordError('Password must be at least 8 characters long.');
        return;
      }
      if (formData.password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
    }

    setPasswordError('');
    onNext();
  };

  return (
    <motion.section
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center w-full h-full justify-between"
    >
      <div className="text-center w-full">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-2 tracking-tight">Create your account</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md font-sans flex-1 flex flex-col justify-center">

        {/* Google Sign-In is not offered here: the OAuth provider isn't
            enabled on the Supabase project yet, so this used to redirect
            straight to a raw Supabase error page instead of anything the
            app could catch and show nicely. Re-add once it's turned on. */}

        <div className="relative group">
          <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">
            Real Name
            <FieldTooltip text="Used only for identity verification and account ownership. You control whether it is displayed publicly." />
          </label>
          <input
            type="text"
            required
            value={formData.displayName}
            onChange={e => setFormData({...formData, displayName: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-sans placeholder:italic placeholder:text-stone-400/60"
            placeholder="e.g. Alex Morgan"
          />
        </div>

        <div className="relative group">
          <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">
            Display Name
            <FieldTooltip text="This is the name readers will normally see." />
          </label>
          <input
            type="text"
            required
            value={formData.penName}
            onChange={e => setFormData({...formData, penName: e.target.value})}
            className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all font-sans placeholder:italic placeholder:text-stone-400/60"
            placeholder="e.g. Alex M."
          />
        </div>

        {!isOAuth && (
          <>
            <div className="relative group">
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">
                Email
                <FieldTooltip text="Used for sign-in, verification, and important account notifications." />
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all placeholder:text-stone-300"
                placeholder="name@example.com"
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password || ''}
                onChange={e => { setFormData({...formData, password: e.target.value}); setPasswordError(''); }}
                className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all placeholder:text-stone-300"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                className="w-full border-b-2 border-t-0 border-x-0 border-stone-200/60 bg-transparent px-0 py-2 text-sm text-stone-900 rounded-none focus:outline-none focus:border-adjung-maroon transition-all placeholder:text-stone-300"
                placeholder="Re-enter your password"
              />
            </div>
          </>
        )}

        {passwordError && (
          <p className="text-xs text-red-600 font-sans text-center">{passwordError}</p>
        )}

        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            className="px-10 py-3 bg-adjung-maroon hover:bg-stone-900 text-[#FDFDFD] font-mono text-xs tracking-widest uppercase transition-all duration-300 rounded-sm shadow-sm font-bold cursor-pointer"
          >
            Continue
          </button>
        </div>
      </form>
    </motion.section>
  );
}
