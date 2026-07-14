import { PublishedRepresentation, DigitalSignature } from '../types';

export interface SignatureRepresentationPayload {
  type: 'drawn' | 'typed';
  strokes?: any[][];
  typedText?: string;
  fontFamily?: string;
  slantAngle: number;
  scale: number;
  yOffset: number;
  letterSpacing: number;
  fontWeight: number | string;
  color: string;
  enableBleed: boolean;
  showBaseline: boolean;
  showLabel: boolean;
  labelText: string;
  canvasWidth: number;
  canvasHeight: number;
  baselineY: number;
}

/**
 * Membina SVG string canonical yang tepat sama dengan output SignatureRenderer.
 * Ini adalah "canonical form" tandatangan — bebas dari React, boleh disimpan
 * terus dalam DB dan dirender semula tanpa perlu logic rendering semula.
 */
function buildSignatureSvgString(payload: SignatureRepresentationPayload): string {
  const {
    type, strokes = [], typedText = '', fontFamily,
    slantAngle, scale, yOffset, letterSpacing, fontWeight,
    color, canvasWidth, canvasHeight, baselineY
  } = payload;

  const activeColor = color || '#802334';
  const filterId = `ink-bleed-sig`;

  const bleedFilter = `<defs>
    <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;

  if (type === 'typed' || strokes.length === 0 || strokes.every((s: any[]) => s.length === 0)) {
    // Typed signature path — mirrors SignatureRenderer typed branch
    const getFontSizeValue = (text: string): number => {
      if (!text) return 48;
      if (text.length > 25) return 24;
      if (text.length > 18) return 32;
      if (text.length > 12) return 40;
      return 48;
    };

    const baseSize = getFontSizeValue(typedText);
    const actualFontSize = baseSize * scale;
    const dynamicViewBoxHeight = Math.max(120, actualFontSize * 2.8);
    const cropY = (canvasHeight / 2) + yOffset - (dynamicViewBoxHeight / 2);
    const viewBox = `0 ${cropY} ${canvasWidth} ${dynamicViewBoxHeight}`;
    const centerX = canvasWidth / 2;

    const lsAttr = letterSpacing ? `letter-spacing="${letterSpacing}px"` : '';
    const textLengthAttr = typedText.length > 18 ? `textLength="370" lengthAdjust="spacingAndGlyphs"` : '';
    const transform = `translate(${centerX}, 100) translate(0, ${yOffset}) rotate(${slantAngle}) scale(${scale}) translate(-${centerX}, -100)`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" style="filter:url(#${filterId});overflow:visible">
  ${bleedFilter}
  <text
    x="${centerX}"
    y="100"
    dominant-baseline="alphabetic"
    text-anchor="middle"
    fill="${activeColor}"
    transform="${transform}"
    font-family="${fontFamily || 'Mrs Saint Delafield, Birthstone, Pinyon Script, cursive'}"
    font-size="${getFontSizeValue(typedText)}"
    font-weight="${fontWeight || 'normal'}"
    ${lsAttr}
    ${textLengthAttr}
  >${typedText}</text>
</svg>`;
  }

  // Drawn signature path — mirrors SignatureRenderer drawn branch
  const viewBox = `24 0 ${canvasWidth - 48} ${canvasHeight}`;
  const centerX = canvasWidth / 2;

  const strokeElements = strokes.map((stroke: any[]) => {
    if (!stroke || stroke.length === 0) return '';

    const pStart = stroke[0];
    const circleEl = `<circle cx="${pStart.x}" cy="${pStart.y}" r="${(pStart.pressure || 2.0) * 0.45}" fill="${activeColor}"/>`;

    const lineEls = stroke.slice(1).map((point: any, i: number) => {
      const pPrev = stroke[i];
      const w = point.pressure !== undefined ? point.pressure : 3.2;
      return `<line x1="${pPrev.x}" y1="${pPrev.y}" x2="${point.x}" y2="${point.y}" stroke="${activeColor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('\n    ');

    return `<g>${circleEl}\n    ${lineEls}</g>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" style="filter:url(#${filterId});overflow:visible">
  ${bleedFilter}
  <g transform="translate(${centerX}, 100) rotate(${slantAngle}) scale(${scale}) translate(-${centerX}, -100)">
    ${strokeElements}
  </g>
</svg>`;
}

export function compileSignature(
  editorState: Exclude<DigitalSignature['editorState'], undefined>,
  labelText: string
): PublishedRepresentation {
  const canvasWidth = editorState.penStyle?.canvasWidth || 680;
  const canvasHeight = editorState.penStyle?.canvasHeight || 200;
  const baselineY = 136; // Constant baseline guideline coordinate

  const payload: SignatureRepresentationPayload = {
    type: editorState.type,
    strokes: editorState.strokes,
    typedText: editorState.typedText,
    fontFamily: editorState.fontFamily,
    slantAngle: editorState.typographyStyle?.slantAngle ?? 0,
    scale: editorState.typographyStyle?.scale ?? 1,
    yOffset: editorState.typographyStyle?.yOffset ?? (editorState.type === 'typed' ? 30 : 0),
    letterSpacing: editorState.typographyStyle?.letterSpacing ?? 0,
    fontWeight: editorState.typographyStyle?.fontWeight ?? 'normal',
    color: editorState.penStyle?.inkColor ?? '#802334',
    enableBleed: true,
    showBaseline: false,
    showLabel: false,
    labelText: labelText,
    canvasWidth,
    canvasHeight,
    baselineY
  };

  const svgData = buildSignatureSvgString(payload);

  return {
    id: `sig-rep-${Date.now()}`,
    version: 1,
    representationType: 'signature',
    representationData: payload,
    svgData,
    metadata: {
      compiledAt: new Date().toISOString(),
      pipelineVersion: '1.0',
      sourceEditor: 'Signature Studio',
      specVersion: 'SPEC-024'
    }
  };
}
