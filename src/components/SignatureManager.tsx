import React, { useState } from 'react';
import { DigitalSignature, IdentityProfile, VectorStroke } from '../types';
import { db } from '../db/mockDb';
import { SignaturePad } from './SignaturePad';
import { SignatureRenderer } from './SignatureRenderer';
import { Plus, Archive, CheckCircle, Trash2 } from 'lucide-react';

interface SignatureManagerProps {
  identity: IdentityProfile;
  onIdentityUpdate: (identity: IdentityProfile) => void;
}

export function SignatureManager({ identity, onIdentityUpdate }: SignatureManagerProps) {
  const [showPad, setShowPad] = useState(false);

  const handleSaveNewSignature = (strokes: VectorStroke[][]) => {
    // If it's the first signature, make it default, otherwise active
    const isFirst = identity.signatures.length === 0;
    const newSig: DigitalSignature = {
      id: `sig-${Date.now()}`,
      label: `Signature ${new Date().toLocaleDateString()}`,
      status: 'Default',
      strokes,
      createdAt: new Date().toISOString()
    };

    const updatedIdentity = { ...identity, signatures: [...identity.signatures.map(s => ({ ...s, status: 'Archived' as const })), newSig] };
    db.updateIdentity(updatedIdentity);
    onIdentityUpdate(updatedIdentity);
    setShowPad(false);
  };

  const handleSetDefault = (sigId: string) => {
    const updatedSignatures = identity.signatures.map(s => {
      if (s.id === sigId) return { ...s, status: 'Default' as const };
      if (s.status === 'Default') return { ...s, status: 'Archived' as const };
      return s;
    });
    const updatedIdentity = { ...identity, signatures: updatedSignatures };
    db.updateIdentity(updatedIdentity);
    onIdentityUpdate(updatedIdentity);
  };

  
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-stone-200 pb-2">
        <div>
          <h3 className="font-serif text-lg text-stone-900">Handwritten Signatures</h3>
          <p className="font-sans text-xs text-stone-500">
            Signatures replace profile photographs. Your default signature represents your public identity.
          </p>
        </div>
        {!showPad && (
          <button
            type="button"
            onClick={() => setShowPad(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDFDFD] border border-adjung-maroon/20 hover:bg-adjung-maroon/5 text-adjung-maroon rounded text-xs font-mono tracking-wider uppercase transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Signature
          </button>
        )}
      </div>

      {showPad && (
        <div className="bg-stone-50 p-4 border border-stone-200 rounded">
          <SignaturePad onSave={handleSaveNewSignature} onCancel={() => setShowPad(false)} />
        </div>
      )}

      {identity.signatures.length === 0 && !showPad ? (
        <div className="text-center py-12 border border-dashed border-stone-300 rounded bg-stone-50">
          <p className="text-stone-500 font-serif italic mb-2">No signatures configured.</p>
          <button
            onClick={() => setShowPad(true)}
            className="text-adjung-maroon font-mono text-xs uppercase tracking-wider hover:underline"
          >
            Create your primary signature
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {identity.signatures.map(sig => (
            <div 
              key={sig.id} 
              className={`border p-4 rounded bg-white relative group flex flex-col justify-between ${
                sig.status === 'Default' ? 'border-adjung-maroon/40 shadow-sm' : 'border-stone-200'
              } ${sig.status === 'Archived' ? 'opacity-70 bg-stone-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest font-semibold text-stone-700">
                    {sig.label}
                  </h4>
                  <p className="text-[9px] font-mono text-stone-400 mt-0.5">
                    {new Date(sig.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {sig.status === 'Default' && (
                    <span className="flex items-center gap-1 text-[9px] font-mono uppercase bg-adjung-maroon text-white px-1.5 py-0.5 rounded">
                      <CheckCircle className="w-2.5 h-2.5" /> Default
                    </span>
                  )}
                  {sig.status === 'Archived' && (
                    <span className="text-[9px] font-mono uppercase bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                  
                </div>
              </div>

              <div className="h-24 border border-stone-100 rounded bg-stone-50 flex items-center justify-center p-2 mb-4">
                <SignatureRenderer strokes={sig.strokes} className="w-full h-full" color={sig.status === 'Archived' ? '#9ca3af' : '#802334'} />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                {sig.status !== 'Default' ? (
                  <button
                    onClick={() => handleSetDefault(sig.id)}
                    className="text-[10px] font-mono uppercase tracking-wider text-adjung-maroon hover:underline"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 cursor-not-allowed">
                    Primary Identity
                  </span>
                )}

                <div className="flex gap-2">
                  {}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
