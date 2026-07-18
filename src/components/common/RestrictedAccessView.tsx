import React from 'react';
import { Lock } from 'lucide-react';
import { BRAND } from '../../config/brand';

interface RestrictedAccessViewProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
  pageName: string;
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({
  onSignInClick,
  onSignUpClick,
  pageName,
}) => {
  return (
    <div className="flex items-center justify-center py-16 px-4 select-none">
      <div className="bg-[#FDFDFD] border border-stone-200 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-sm w-full max-w-[360px] overflow-hidden text-center">
        
        {/* Header Block matching LoginModal */}
        <div className="border-b border-stone-200 p-5 bg-[#FDFDFD]">
          <div className="flex justify-center mb-2.5">
            <div className="p-2 bg-adjung-maroon/5 border border-adjung-maroon/20 rounded-full text-adjung-maroon">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="font-serif text-2xl text-adjung-maroon tracking-tight">Restricted Access</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1.5 leading-normal">
            Sign in to your {BRAND.shortName} account.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-sans text-stone-600">
          <p className="font-sans text-[12.5px] leading-relaxed text-stone-600 select-text">
            The <strong>{pageName}</strong> page is reserved for registered Adjung members. Sign in to your account or register as a member to continue reading.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onSignInClick}
              className="w-full bg-adjung-maroon hover:bg-[#912b3e] text-[#FDFDFD] py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors shadow-sm font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* Divider line matching LoginModal */}
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-stone-200/90"></div>
            <span className="px-3 font-mono text-[8px] text-stone-400 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-stone-200/90"></div>
          </div>

          <div className="text-center font-mono text-[9.5px] text-stone-500 leading-normal">
            Not registered as a member yet?{' '}
            <button
              type="button"
              onClick={onSignUpClick}
              className="text-adjung-maroon font-bold hover:underline cursor-pointer font-sans text-xs ml-0.5"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
