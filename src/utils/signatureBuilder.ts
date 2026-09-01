import { DigitalSignature } from '../types';
import { generateUUID } from '../utils';

// Signup's signatureData can arrive in four different shapes depending on
// how it was captured — normalize all of them into a real DigitalSignature
// so saveIdentity() actually persists it, instead of being silently discarded.
//   1. Typed (Step8's own typing UI): signatureData is a plain string.
//   2. Drawn via SignaturePad: signatureData is the rich object SignaturePad's
//      onSave produces — { strokes, type:'drawn', penStyle, typographyStyle }.
//   3. Typed via SignaturePad's own Draw/Type toggle: same call site as #2
//      (Step8 tags it 'draw' because that's the button that opened the pad,
//      not which mode was used inside it) but the object reads
//      { strokes: [], type:'typed', typedText, fontFamily, typographyStyle }.
//      Branch on the object's own `type`, not the outer flag, or this shape
//      falls into #2's strokes check and is silently discarded as empty.
//   4. Drawn via QR/mobile-sync: a bare { strokes, type:'drawn' } with no
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
    const data = signatureData as {
      type?: 'drawn' | 'typed';
      strokes?: unknown;
      typedText?: string;
      fontFamily?: string;
      penStyle?: DigitalSignature['penStyle'];
      typographyStyle?: DigitalSignature['typographyStyle'];
    };

    if (data.type === 'typed') {
      const typedText = (data.typedText || '').trim();
      if (!typedText) return null;
      return {
        ...base,
        type: 'typed',
        typedText,
        strokes: [],
        fontFamily: data.fontFamily,
        typographyStyle: data.typographyStyle,
      };
    }

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
