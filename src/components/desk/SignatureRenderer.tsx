import React, { useId } from 'react';
import { VectorStroke, PublishedRepresentation } from '../../types';

interface SignatureRendererProps {
  strokes: VectorStroke[][];
  type?: 'drawn' | 'typed';
  typedText?: string;
  fontFamily?: string;
  className?: string;
  color?: string;
  strokeWidth?: number; // Base width fallback
  enableBleed?: boolean; // Toggles the organic ink bleed filter
  renderBaselineLayout?: boolean; // Controls visual guidelines
  representation?: PublishedRepresentation; // SVG representation from database
  typographyStyle?: {
    letterSpacing?: number;
    fontWeight?: number;
    slantAngle?: number;
    scale?: number;
    yOffset?: number;
  };
  penStyle?: {
    nibAngle?: number;
    inkFlowWeight?: number;
    baselineY?: number;
    canvasHeight?: number;
  };
}

export function SignatureRenderer({ 
  strokes, 
  type = 'drawn',
  typedText,
  fontFamily = 'Mrs Saint Delafield, Birthstone, Pinyon Script, cursive',
  className = "w-full h-full", 
  color = "#802334", // adjung-maroon
  strokeWidth = 3.2, // Enhanced default thickness
  enableBleed = true,
  renderBaselineLayout = false,
  representation,
  typographyStyle,
  penStyle
}: SignatureRendererProps) {
  
  const id = useId();
  const filterId = `ink-bleed-${id.replace(/:/g, '-')}`;

  // === SVG FAST PATH ===
  // Jika representation mengandungi svgData (canonical SVG string yang dikompil semasa save),
  // render sebagai data URL dalam <img> supaya ia mengisi container dengan betul.
  if (representation?.svgData) {
    const svgBase64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(representation.svgData)}`;
    return (
      <img
        src={svgBase64}
        alt="signature"
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    );
  }


  const hasStrokes = strokes && strokes.length > 0 && !strokes.every(s => s.length === 0);

  if (type === 'typed' || (!hasStrokes && typedText)) {
    const activeText = typedText || '';
    if (!activeText) {
      return (
        <div className={`flex items-center justify-center text-stone-300 font-sans select-none ${className}`}>
          No signature
        </div>
      );
    }
    
    const textScale = typographyStyle?.scale !== undefined ? typographyStyle.scale : 1;

    // Always center the text in a fixed-proportion viewBox — ignoring penStyle's
    // capture-time baselineY/canvasHeight here, since those record where the text
    // happened to sit on the original signing canvas, not where it should sit in
    // an arbitrary downstream container. Using them caused the same signature to
    // render off-center at inconsistent sizes across pages.
    const calculatedWidth = Math.max(activeText.length * 28 * textScale + 40, 400);
    const canvasHeight = 200;
    const viewBox = `0 0 ${calculatedWidth} ${canvasHeight}`;
    // A cursive signature's ink sits mostly above its baseline (ascenders,
    // looping capitals) with only descenders below — a mid-canvas baseline
    // left roughly equal empty space on both sides, reading as the
    // signature floating with an oversized gap under it. Weighting the
    // baseline toward the lower third gives ascenders room without leaving
    // the bottom half of the canvas empty.
    const yPos = canvasHeight * 0.7;

    return (
      <svg 
        viewBox={viewBox} 
        className={`${className} overflow-visible`}
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          filter: enableBleed ? `url(#${filterId})` : 'none',
          transform: `rotate(${typographyStyle?.slantAngle || 0}deg)`,
          transformOrigin: 'center center'
        }}
      >
        {enableBleed && (
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="0.22" 
                numOctaves="3" 
                result="noise" 
              />
              <feDisplacementMap 
                in="SourceGraphic" 
                in2="noise" 
                scale="1.2" 
                xChannelSelector="R" 
                yChannelSelector="G" 
              />
            </filter>
          </defs>
        )}
        <text 
          x="50%" 
          y={`${yPos}px`}
          dominantBaseline="alphabetic" 
          textAnchor="middle" 
          fill={color}
          textLength={activeText.length > 18 ? "370" : undefined}
          lengthAdjust={activeText.length > 18 ? "spacingAndGlyphs" : undefined}
          style={{ 
            fontFamily: fontFamily || 'Mrs Saint Delafield, Birthstone, Pinyon Script, cursive', 
            fontSize: `${64 * textScale}px`,
            letterSpacing: typographyStyle?.letterSpacing ? `${typographyStyle.letterSpacing}px` : 'normal',
            fontWeight: typographyStyle?.fontWeight || 'normal'
          }}
        >
          {activeText}
        </text>
      </svg>
    );
  }

  if (!hasStrokes) {
    return (
      <div className={`flex items-center justify-center text-stone-300 font-sans select-none ${className}`}>
        No signature
      </div>
    );
  }

  // Calculate bounding box to normalize and scale the signature
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasValidPoints = false;
  
  strokes.forEach(stroke => {
    stroke.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
      hasValidPoints = true;
    });
  });

  if (!hasValidPoints) {
    return (
      <div className={`flex items-center justify-center text-stone-300 font-sans select-none ${className}`}>
        Empty signature
      </div>
    );
  }

  // Add a small padding to prevent clipping of thick strokes
  const padding = 12;
  const width = Math.max(maxX - minX + padding * 2, 100);

  // Always crop the viewBox tightly to the actual ink bounding box, regardless of
  // penStyle's capture-time baselineY/canvasHeight. Using the full capture canvas
  // height left uneven empty space above or below the strokes depending on where
  // on the original canvas the signature happened to be drawn — since
  // preserveAspectRatio centers the *viewBox*, not the ink, that empty space is
  // what made the same signature look off-center and inconsistently sized
  // between Folio's hero corner and the Biography identity card.
  const height = Math.max(maxY - minY + padding * 2, 50);
  const viewBox = `0 0 ${width} ${height}`;
  const mapX = (x: number) => x - minX + padding;
  const mapY = (y: number) => y - minY + padding;

  return (
    <svg 
      viewBox={viewBox} 
      className={`${className} overflow-visible`}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        filter: enableBleed ? `url(#${filterId})` : 'none',
        transform: `rotate(${typographyStyle?.slantAngle || 0}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {enableBleed && (
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            {/* Create dynamic organic texture boundary mapping */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.22" 
              numOctaves="3" 
              result="noise" 
            />
            {/* Displace pixels slightly based on noise to simulate paper fiber bleed */}
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="1.2" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      )}

      <g style={{
        transform: `scale(${typographyStyle?.scale !== undefined ? typographyStyle.scale : 1})`,
        transformOrigin: 'center center'
      }}>
        {strokes.map((stroke, strokeIdx) => {
          if (stroke.length === 0) return null;
          
          // Render first point as an ink pooling dot
          const pStart = stroke[0];
          const startX = mapX(pStart.x);
          const startY = mapY(pStart.y);
          const startWidth = pStart.pressure || strokeWidth;

          return (
            <g key={strokeIdx}>
              {/* Ink pooling cap */}
              <circle
                cx={startX}
                cy={startY}
                r={startWidth * 0.45}
                fill={color}
              />

              {/* Variable-width connected segments */}
              {stroke.map((point, pointIdx) => {
                if (pointIdx === 0) return null;
                
                const pPrev = stroke[pointIdx - 1];
                const x1 = mapX(pPrev.x);
                const y1 = mapY(pPrev.y);
                const x2 = mapX(point.x);
                const y2 = mapY(point.y);
                
                // Width matches the point's computed pressure, falls back to default
                const w = point.pressure !== undefined ? point.pressure : strokeWidth;

                return (
                  <line
                    key={pointIdx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={w}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
