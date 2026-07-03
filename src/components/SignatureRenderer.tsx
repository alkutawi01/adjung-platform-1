import React from 'react';
import { VectorStroke } from '../types';

interface SignatureRendererProps {
  strokes: VectorStroke[][];
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export function SignatureRenderer({ 
  strokes, 
  className = "w-full h-full", 
  color = "#802334", 
  strokeWidth = 2 
}: SignatureRendererProps) {
  
  if (!strokes || strokes.length === 0) {
    return (
      <div className={`flex items-center justify-center text-stone-300 italic font-serif ${className}`}>
        No signature
      </div>
    );
  }

  // Calculate bounding box to normalize and scale the signature
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  strokes.forEach(stroke => {
    stroke.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
  });

  // Add a small padding
  const padding = 10;
  const width = Math.max(maxX - minX + padding * 2, 100);
  const height = Math.max(maxY - minY + padding * 2, 50);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {strokes.map((stroke, i) => {
        if (stroke.length === 0) return null;
        
        const d = stroke.reduce((acc, point, index) => {
          const x = point.x - minX + padding;
          const y = point.y - minY + padding;
          return acc + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        }, '');

        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
