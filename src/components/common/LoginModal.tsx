import React from 'react';
import { BRAND } from '../../config/brand';
import { User } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginError: string;
  setLoginError: (err: string) => void;
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  setShowSignUpWizard: (show: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  loginError,
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  handleLogin,
  rememberMe,
  setRememberMe,
  setShowSignUpWizard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-md w-full overflow-hidden scholarly-border">
        
        {/* Modal header */}
        <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] text-center">
          <h3 className="font-serif text-2xl text-adjung-maroon">Sign In</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1">Sign in to your {BRAND.shortName} account.</p>
        </div>

        {/* Modal form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs font-sans">
          
          {loginError && (
            <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 rounded font-sans text-xs">
              {loginError}
            </div>
          )}

          <div>
            <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1 font-semibold">Email Address</label>
            <input
              type="email"
              placeholder="e.g. scholar@adjung.com"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Password</label>
            <input
              type="password"
              placeholder="Password matches 'password'"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon"
              required
            />
          </div>

          <div className="flex items-center select-none pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#802334] rounded border-stone-300 text-[#802334] focus:ring-adjung-maroon cursor-pointer mr-2"
            />
            <label htmlFor="rememberMe" className="font-mono text-[9px] uppercase tracking-wider text-stone-500 cursor-pointer font-semibold">
              Remember me
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 border border-stone-200 hover:bg-stone-50 text-stone-600 py-2.5 rounded text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] py-2.5 rounded text-xs font-mono uppercase tracking-wider transition shadow-sm font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* OR divider */}
          <div className="flex items-center my-3 select-none">
            <div className="flex-1 border-t border-stone-200"></div>
            <span className="px-3 font-mono text-[8px] text-stone-400 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-stone-200"></div>
          </div>

          {/* Google Sign-In button */}
          <div>
            <button
              type="button"
              onClick={() => {
                alert('Google Sign-In: Integrasi OAuth 2.0 akan diaktifkan di Fasa 2. (Emel tidak memerlukan pengesahan tambahan kerana telah disahkan oleh Google).');
              }}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 py-2.5 rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer shadow-sm font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Registration Prompt */}
          <div className="border-t border-stone-200/50 pt-4 mt-4 text-center select-none">
            <p className="font-sans text-xs text-stone-500">
              Not registered as a Member yet?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowSignUpWizard(true);
                }}
                className="text-adjung-maroon hover:underline font-semibold cursor-pointer ml-1 font-sans text-xs transition duration-250"
              >
                Register here
              </button>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
export default LoginModal;
