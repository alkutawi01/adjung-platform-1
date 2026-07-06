import React, { useId } from 'react';
import { VectorStroke } from '../types';

interface SignatureRendererProps {
  strokes: VectorStroke[][];
  type?: 'drawn' | 'typed';
  typedText?: string;
  fontFamily?: string;
  className?: string;
  color?: string;
  strokeWidth?: number; // Base width fallback
  enableBleed?: boolean; // Toggles the organic ink bleed filter
  typographyStyle?: {
    letterSpacing?: number;
    fontWeight?: number;
    slantAngle?: number;
    scale?: number;
  };
}

export function SignatureRenderer({ 
  strokes, 
  type = 'drawn',
  typedText,
  fontFamily = 'Mistrully, Dancing Script, cursive',
  className = "w-full h-full", 
  color = "#802334", // Adjung-maroon
  strokeWidth = 3.2, // Enhanced default thickness
  enableBleed = true,
  typographyStyle
}: SignatureRendererProps) {
  
  const id = useId();
  const filterId = `ink-bleed-${id.replace(/:/g, '-')}`;

  if (type === 'typed') {
    if (!typedText) {
      return (
        <div className={`flex items-center justify-center text-stone-300 italic font-serif select-none ${className}`}>
          No signature
        </div>
      );
    }
    
    return (
      <svg 
        viewBox="0 0 400 150" 
        className={`${className} overflow-visible`}
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: enableBleed ? `url(#${filterId})` : 'none' }}
      >
        {enableBleed && (
          <defs>
            <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
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
          y="50%" 
          dominantBaseline="middle" 
          textAnchor="middle" 
          fill={color}
          textLength={typedText.length > 18 ? "370" : undefined}
          lengthAdjust={typedText.length > 18 ? "spacingAndGlyphs" : undefined}
          style={{ 
            fontFamily: fontFamily || 'Mistrully, Dancing Script, cursive', 
            fontSize: '64px',
            letterSpacing: typographyStyle?.letterSpacing ? `${typographyStyle.letterSpacing}px` : 'normal',
            fontWeight: typographyStyle?.fontWeight || 'normal',
            transform: `rotate(${typographyStyle?.slantAngle || 0}deg) scale(${typographyStyle?.scale !== undefined ? typographyStyle.scale : 1})`,
            transformOrigin: 'center center'
          }}
        >
          {typedText}
        </text>
      </svg>
    );
  }

  if (!strokes || strokes.length === 0 || strokes.every(s => s.length === 0)) {
    return (
      <div className={`flex items-center justify-center text-stone-300 italic font-serif select-none ${className}`}>
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
      <div className={`flex items-center justify-center text-stone-300 italic font-serif select-none ${className}`}>
        Empty signature
      </div>
    );
  }

  // Add a small padding to prevent clipping of thick strokes
  const padding = 12;
  const width = Math.max(maxX - minX + padding * 2, 100);
  const height = Math.max(maxY - minY + padding * 2, 50);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={`${className} overflow-visible`}
      preserveAspectRatio="xMidYMid meet"
      style={{ filter: enableBleed ? `url(#${filterId})` : 'none' }}
    >
      {enableBleed && (
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
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
        transform: `rotate(${typographyStyle?.slantAngle || 0}deg) scale(${typographyStyle?.scale !== undefined ? typographyStyle.scale : 1})`,
        transformOrigin: 'center center'
      }}>
        {strokes.map((stroke, strokeIdx) => {
          if (stroke.length === 0) return null;
          
          // Render first point as an ink pooling dot
          const pStart = stroke[0];
          const startX = pStart.x - minX + padding;
          const startY = pStart.y - minY + padding;
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
                const x1 = pPrev.x - minX + padding;
                const y1 = pPrev.y - minY + padding;
                const x2 = point.x - minX + padding;
                const y2 = point.y - minY + padding;
                
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
