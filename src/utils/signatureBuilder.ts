import { DigitalSignature } from '../types';
import { generateUUID } from '../utils';

// Signup's signatureData can arrive in three different shapes depending on
// how it was captured — normalize all of them into a real DigitalSignature
// so saveIdentity() actually persists it, instead of being silently discarded.
//   1. Typed (Step8's own typing UI): signatureData is a plain string.
//   2. Drawn via SignaturePad: signatureData is the rich object SignaturePad's
//      onSave produces — { strokes, type:'drawn', penStyle, typographyStyle }.
//   3. Drawn via QR/mobile-sync: a bare { strokes, type:'drawn' } with no
//      penStyle/typographyStyle (MobileSignCanvas doesn't capture those).
export function buildDigitalSignature(
  signatureType: 'draw' | 'typo' | undefined,
  signatureData: unknown
): DigitalSignature | null {
  if (!signatureData) return null;

  const base = {
    id: generateUUID(),
    label: 'Signature',
    status: 'Default' as const,
    createdAt: new Date().toISOString(),
  };

  if (signatureType === 'typo' && typeof signatureData === 'string') {
    const typedText = signatureData.trim();
    if (!typedText) return null;
    return {
      ...base,
      type: 'typed',
      typedText,
      strokes: [],
    };
  }

  if (signatureType === 'draw' && typeof signatureData === 'object') {
    const data = signatureData as { strokes?: unknown; penStyle?: DigitalSignature['penStyle']; typographyStyle?: DigitalSignature['typographyStyle'] };
    if (!Array.isArray(data.strokes) || data.strokes.length === 0) return null;
    return {
      ...base,
      type: 'drawn',
      strokes: data.strokes as DigitalSignature['strokes'],
      penStyle: data.penStyle,
      typographyStyle: data.typographyStyle,
    };
  }

  return null;
}
