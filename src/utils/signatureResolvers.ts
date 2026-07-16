import { Entry, IdentityProfile, VectorStroke, DigitalSignature } from '../types';

// Single source of truth for "which signature record applies to this author/entry" —
// previously duplicated (with drift) across App.tsx, FolioView.tsx, and WritingDesk.tsx.

export function resolveDigitalSignature(authorId: string, identities: IdentityProfile[], entry?: Entry | null): DigitalSignature | undefined {
  const identity = identities.find(i => i.accountId === authorId);
  if (!identity || !identity.signatures) return undefined;
  if (entry?.signatureVersionId) {
    const sig = identity.signatures.find(s => s.id === entry.signatureVersionId);
    if (sig) return sig;
  }
  return identity.signatures.find(s => s.status === 'Default');
}

export function resolveSignatureStrokes(entry: Entry | null, authorId: string, identities: IdentityProfile[]): VectorStroke[][] | undefined {
  const identity = identities.find(i => i.accountId === authorId);
  if (!identity) return undefined;

  if (entry?.signatureVersionId) {
    const sig = identity.signatures.find(s => s.id === entry.signatureVersionId);
    if (sig) return sig.strokes;
  }

  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig && defaultSig.type === 'drawn') return defaultSig.strokes;
  return undefined;
}

export function resolveSignatureText(authorId: string, fallback: string, identities: IdentityProfile[]): string {
  const identity = identities.find(i => i.accountId === authorId);
  if (!identity || !identity.signatures) return fallback;
  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig) {
    if (defaultSig.type === 'typed') return defaultSig.typedText;
    if (defaultSig.type === 'drawn') return ''; // If drawn, we don't display text fallback
  }
  return fallback;
}

export function resolveSignatureFont(authorId: string, identities: IdentityProfile[]): string | undefined {
  const identity = identities.find(i => i.accountId === authorId);
  if (!identity || !identity.signatures) return undefined;
  const defaultSig = identity.signatures.find(s => s.status === 'Default');
  if (defaultSig && defaultSig.type === 'typed' && defaultSig.fontFamily) {
    const rawFamily = defaultSig.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    return `"${rawFamily}", cursive`;
  }
  return undefined;
}
