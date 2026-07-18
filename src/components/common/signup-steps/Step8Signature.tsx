import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, QrCode, Laptop, Smartphone, Check, PenTool, Type, Loader2 } from 'lucide-react';
import { SignaturePad } from '../../desk/SignaturePad';
import { SignatureRenderer } from '../../desk/SignatureRenderer';
import { supabase } from '../../../config/supabase';
import SimulatedMobileCanvas from './SimulatedMobileCanvas';

interface Step8SignatureProps {
  formData: any;
  setFormData: (data: any) => void;
}

// Headless subsection consumed by Step6PublicProfile — no own heading/footer;
// signature is optional, so there is no Continue gate here.
export default function Step8Signature({ formData, setFormData }: Step8SignatureProps) {
  const [mode, setMode] = useState<'choose' | 'draw' | 'typo' | 'qr'>('choose');
  const [isDrawingPadOpen, setIsDrawingPadOpen] = useState(false);
  const [showSimulatedPhone, setShowSimulatedPhone] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [typedText, setTypedText] = useState(formData.displayName || '');
  const [sessionId, setSessionId] = useState<string>('');

  const hasRecordedSignature = !!formData.signatureData;

  // Real-time Supabase Realtime (Broadcast) sync listener
  useEffect(() => {
    if (mode === 'qr') {
      const newSessionId = `sync-session-${Date.now()}`;
      setSessionId(newSessionId);

      const channel = supabase.channel(`signature_sync:${newSessionId}`);
      channel
        .on('broadcast', { event: 'completed' }, ({ payload }) => {
          setIsSyncing(true);
          setSyncProgress(0);

          // Animate progress transition
          const interval = setInterval(() => {
            setSyncProgress((prev) => {
              if (prev >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                  setIsSyncing(false);
                  setFormData({
                    ...formData,
                    signatureType: 'draw',
                    signatureData: { strokes: payload.strokes, type: 'drawn' }
                  });
                  setMode('choose');
                }, 400);
                return 100;
              }
              return prev + 25;
            });
          }, 100);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mode]);

  const handleSaveDrawn = (data: any) => {
    setFormData({
      ...formData,
      signatureType: 'draw',
      signatureData: data
    });
    setIsDrawingPadOpen(false);
  };

  const handleSaveTypo = () => {
    setFormData({
      ...formData,
      signatureType: 'typo',
      signatureData: typedText || formData.displayName
    });
    setMode('choose');
  };

  const handleSimulateMobileSign = (strokes: any[]) => {
    setIsSyncing(true);
    setSyncProgress(0);
    setShowSimulatedPhone(false);
    
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setFormData({
              ...formData,
              signatureType: 'draw',
              signatureData: { strokes, type: 'drawn' }
            });
            setMode('choose');
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const mobileSignUrl = sessionId 
    ? `${window.location.origin}/mobile-sign?session=${sessionId}`
    : '';

  return (
    <div className="w-full">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">Signature (optional)</label>

      {/* Main active interactive block */}
      <div className="w-full flex flex-col justify-center items-center">

        {/* Syncing Progress Overlay */}
        {isSyncing && (
          <div className="bg-white border border-stone-200/90 p-8 rounded-sm text-center shadow-lg w-full max-w-md flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-adjung-maroon animate-spin" />
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">SIGNATURE SYNCHRONIZATION</p>
              <p className="font-sans text-sm text-stone-600 font-normal">Copying signature data from mobile device...</p>
            </div>
            <div className="w-48 bg-stone-100 h-1 rounded-full overflow-hidden relative">
              <div className="bg-adjung-maroon h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
            </div>
            <span className="font-mono text-xs text-stone-500 font-bold">{syncProgress}%</span>
          </div>
        )}

        {/* Dashboard Choice State */}
        {!isSyncing && mode === 'choose' && (
          <div className="w-full space-y-4 max-w-md">
            
            {/* If signature exists, display certificate card */}
            {hasRecordedSignature ? (
              <div className="border border-stone-200/90 bg-white p-5 rounded-sm shadow-sm relative overflow-hidden select-none">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-adjung-maroon" />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-bold">
                      {formData.signatureType === 'typo' ? 'Typographic Signature' : 'Handdrawn Signature'}
                    </span>
                    <h4 className="font-serif text-sm font-semibold text-stone-900 mt-1.5">Aesthetic Seal Registered</h4>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>

                {/* The visual preview of the signature */}
                <div className="bg-stone-50 border border-stone-200 h-28 rounded flex items-center justify-center relative p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(#802334/0.015_1px,transparent_1px)] [background-size:12px_12px]" />
                  <SignatureRenderer
                    strokes={formData.signatureType === 'typo' ? [] : (formData.signatureData?.strokes || [])}
                    type={formData.signatureType === 'typo' ? 'typed' : 'drawn'}
                    typedText={formData.signatureType === 'typo' ? formData.signatureData : ''}
                    className="w-full h-full relative z-10"
                  />
                  <span className="absolute bottom-2 right-3 font-mono text-[7px] text-stone-300 tracking-wider">ADJUNG SECURE</span>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
                  <span className="font-mono text-[7px] text-stone-400">HASH: ADJ-SHA256-{(formData.displayName || 'x').substring(0, 3).toUpperCase()}-77AC</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, signatureType: 'draw', signatureData: '' });
                      setMode('choose');
                    }}
                    className="text-[10px] font-mono uppercase text-adjung-maroon hover:underline font-bold"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              // Empty selection state
              <div className="space-y-3">
                <button 
                  type="button" 
                  className="w-full border border-stone-200 bg-white p-4 text-left hover:border-adjung-maroon focus:border-adjung-maroon hover:shadow-md transition-all duration-300 flex items-center justify-between rounded-sm cursor-pointer group" 
                  onClick={() => setIsDrawingPadOpen(true)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800 font-serif group-hover:text-adjung-maroon transition-colors flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-adjung-maroon/90" /> Draw signature on PC / tablet
                    </span>
                    <span className="text-xs text-stone-400 mt-1 font-sans">Use touch trackpad or mouse cursor</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-stone-300 group-hover:text-adjung-maroon rotate-180 transition-transform" />
                </button>
                
                <button 
                  type="button" 
                  className="w-full border border-stone-200 bg-white p-4 text-left hover:border-adjung-maroon focus:border-adjung-maroon hover:shadow-md transition-all duration-300 flex items-center justify-between rounded-sm cursor-pointer group" 
                  onClick={() => setMode('typo')}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800 font-serif group-hover:text-adjung-maroon transition-colors flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-adjung-maroon/90" /> Typographic signature
                    </span>
                    <span className="text-xs text-stone-400 mt-1 font-sans">Generate stylized signature from your pen name</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-stone-300 group-hover:text-adjung-maroon rotate-180 transition-transform" />
                </button>

                <button 
                  type="button" 
                  className="w-full border border-stone-200 bg-white p-4 text-left hover:border-adjung-maroon focus:border-adjung-maroon hover:shadow-md transition-all duration-300 flex items-center justify-between rounded-sm cursor-pointer group" 
                  onClick={() => setMode('qr')}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800 font-serif group-hover:text-adjung-maroon transition-colors flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-adjung-maroon/90" /> Draw on mobile (Scan QR)
                    </span>
                    <span className="text-xs text-stone-400 mt-1 font-sans">Scan to sign easily on your smartphone touch screen</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-stone-300 group-hover:text-adjung-maroon rotate-180 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Typographic Creator Step */}
        {!isSyncing && mode === 'typo' && (
          <div className="w-full mb-4 text-center max-w-md space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-2 select-none">Stylized Typographic Mark</p>
            
            <div className="border border-stone-200 bg-white h-36 flex items-center justify-center rounded-sm shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#802334/0.02_1px,transparent_1px)] [background-size:16px_16px]" />
              {typedText ? (
                <SignatureRenderer
                  strokes={[]}
                  type="typed"
                  typedText={typedText}
                  className="w-full h-full px-6 relative z-10"
                />
              ) : (
                <span className="font-signature text-5xl text-stone-300 px-6 z-10 select-none">
                  Your Name
                </span>
              )}
            </div>

            <div className="text-left space-y-1.5">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-stone-400">Pen & Short Name</label>
              <input 
                type="text" 
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                maxLength={20}
                className="w-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 rounded-sm focus:outline-none focus:border-adjung-maroon transition-all font-sans"
                placeholder="E.g. Al-Ghazali"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                className="flex-1 py-2 border border-stone-200 text-stone-500 font-mono text-[10px] uppercase rounded-sm hover:bg-stone-50 transition cursor-pointer" 
                onClick={() => setMode('choose')}
              >
                Back
              </button>
              <button 
                type="button" 
                className="flex-1 py-2 bg-adjung-maroon text-[#FDFDFD] font-mono text-[10px] uppercase rounded-sm hover:bg-stone-900 transition font-bold cursor-pointer"
                onClick={handleSaveTypo}
              >
                Use This Signature
              </button>
            </div>
          </div>
        )}

        {/* QR Mobile Synchronization View */}
        {!isSyncing && mode === 'qr' && (
          <div className="w-full max-w-lg space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              
              {/* QR Panel representation */}
              <div className="border border-stone-200 bg-white p-4 rounded-sm flex flex-col items-center text-center shadow-sm relative">
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-adjung-maroon rounded-full animate-ping" />
                  <span className="font-mono text-[7px] text-stone-400 tracking-widest uppercase">Secured Room</span>
                </div>
                
                {/* Real QR Code via external API */}
                {sessionId ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mobileSignUrl)}`}
                    alt="QR Code for mobile signature"
                    className="w-32 h-32 mt-2 select-none border border-stone-200 p-1 bg-white rounded"
                  />
                ) : (
                  <div className="w-32 h-32 bg-stone-50 border border-stone-200 rounded flex items-center justify-center p-2 mt-2">
                    <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
                  </div>
                )}
                
                <span className="font-mono text-[9px] text-stone-400 font-bold tracking-widest mt-3">SESSION: {sessionId ? sessionId.replace('sync-session-', 'ADJ-') : 'PENDING'}</span>
              </div>

              {/* Instructions and connection simulation trigger */}
              <div className="space-y-3">
                <div className="flex gap-2.5 items-start">
                  <Smartphone className="w-5 h-5 text-adjung-maroon shrink-0 mt-0.5" />
                  <p className="text-[12px] text-stone-600 font-sans leading-relaxed font-normal">
                    Scan the QR code on the left with your smartphone's camera to open the mobile <span className="font-sans font-semibold text-stone-800">Calligraphy Pad</span>.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Laptop className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-stone-600 font-sans leading-relaxed font-normal">
                    The signature drawn on your phone screen will be synchronized directly to this computer.
                  </p>
                </div>

                {/* Direct Testing URL */}
                <div className="bg-stone-50 border border-stone-200/90 p-2 rounded text-[10px] text-stone-500 font-sans leading-relaxed select-all">
                  <span className="font-bold text-stone-700 block mb-0.5">Direct link (for local testing):</span>
                  <a href={mobileSignUrl} target="_blank" rel="noopener noreferrer" className="text-adjung-maroon hover:underline break-all block">
                    {mobileSignUrl}
                  </a>
                </div>

                {/* Simulated trigger button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSimulatedPhone(true)}
                    className="w-full py-2 bg-stone-900 hover:bg-adjung-maroon text-white font-mono text-[10px] uppercase rounded-sm transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer shadow-sm border border-stone-800"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Simulate Smartphone
                  </button>
                </div>
              </div>

            </div>

            <div className="pt-2 flex justify-center">
              <button 
                type="button" 
                className="px-6 py-1.5 border border-stone-200 text-stone-500 font-mono text-[10px] uppercase rounded-sm hover:bg-stone-50 transition cursor-pointer" 
                onClick={() => setMode('choose')}
              >
                Back to Options
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Floating Smartphone Mockup Overlay inside the wizard */}
      <AnimatePresence>
        {showSimulatedPhone && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-[#0c0a09]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <SimulatedMobileCanvas 
              onSave={handleSimulateMobileSign} 
              onCancel={() => setShowSimulatedPhone(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen drawing modal via native SignaturePad component (resolves issue 1!) */}
      {isDrawingPadOpen && (
        <SignaturePad
          onSave={handleSaveDrawn}
          onCancel={() => setIsDrawingPadOpen(false)}
          defaultName={formData.displayName}
        />
      )}

    </div>
  );
}
