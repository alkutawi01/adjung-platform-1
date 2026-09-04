import React from 'react';
import { VectorStroke, DigitalSignature } from '../../types';
import { SignatureRenderer } from './SignatureRenderer';
import { ShieldCheck } from 'lucide-react';
import {
  DEFAULT_BASELINE_Y,
  DEFAULT_CANVAS_HEIGHT,
  SIG_BOX,
  signatureNameOffset,
} from './signatureMetrics';

interface SignatureLayoutProps {
  strokes?: VectorStroke[][];
  signature?: DigitalSignature;
  penName: string;
  date?: string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  role?: string;
  affiliation?: string;
}

export function SignatureLayout({
  strokes,
  signature,
  penName,
  date,
  className = "",
  color = "#802334", // adjung-maroon
  strokeWidth = 3.2,
  role,
  affiliation
}: SignatureLayoutProps) {
  // SignatureRenderer's typed-text branch deliberately ignores a typed
  // signature's stored penStyle and always draws the ink at the fixed
  // DEFAULT_BASELINE_Y/DEFAULT_CANVAS_HEIGHT position (see its own comment:
  // consistent placement across contexts matters more than the capture-time
  // value for typed text). This layout has to agree, or it draws the
  // guideline and computes the name offset against a baseline the ink was
  // never actually placed on — for a typed signature carrying a real captured
  // penStyle (e.g. from a mobile QR sync session before the account switched
  // to typed), that showed as the name and guideline sitting well below
  // where the cursive ink actually rendered. Only a 'drawn' signature's own
  // stroke placement depends on its captured baseline; typed ink does not.
  const useStoredBaseline = signature?.type === 'drawn';
  const baselineY = useStoredBaseline && signature?.penStyle?.baselineY !== undefined ? signature.penStyle.baselineY : DEFAULT_BASELINE_Y;
  const canvasHeight = useStoredBaseline && signature?.penStyle?.canvasHeight !== undefined ? signature.penStyle.canvasHeight : DEFAULT_CANVAS_HEIGHT;
  
  // Calculate relative top percentage for the architectural baseline
  const baselinePercent = (baselineY / canvasHeight) * 100;

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      
      {/* Signature Graphic & Baseline Area */}
      <div className="relative w-64 h-24 overflow-visible mix-blend-multiply flex flex-col justify-start">
        
        {/* The Signature SVG */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
          <SignatureRenderer 
            representation={signature?.representation}
            strokes={signature?.strokes || strokes || []} 
            type={signature?.type || 'drawn'}
            typedText={signature?.typedText}
            fontFamily={signature?.fontFamily}
            typographyStyle={signature?.typographyStyle}
            penStyle={signature?.penStyle}
            className="w-full h-full overflow-visible" 
            color={color} 
            strokeWidth={strokeWidth} 
            enableBleed={true}
          />
        </div>

        {/* The Baseline Guideline line positioned exactly matching the baselineY percentage */}
        <div 
          className="absolute left-0 right-0 border-b border-stone-400 pointer-events-none z-0"
          style={{ top: `${baselinePercent}%` }}
        />
        
      </div>

      {/* Author details */}
      <div
        className="flex flex-col items-center"
        style={{ marginTop: `${signatureNameOffset(baselineY, canvasHeight, SIG_BOX.h)}px` }}
      >
        <div className="font-sans font-semibold text-stone-900 tracking-wide text-sm">
          {penName}
        </div>
        {affiliation && (
          <div className="font-sans font-normal text-[10px] text-stone-400 mt-0.5 select-all">
            {affiliation}
          </div>
        )}
        {role && (
          <div className="font-mono text-[8px] uppercase tracking-widest text-stone-400/90 mt-0.5">
            {role}
          </div>
        )}
        {date && (
          <div className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mt-1 select-none">
            {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
      </div>

    </div>
  );
}
export default SignatureLayout;
