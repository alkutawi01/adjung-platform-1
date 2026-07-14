import React from 'react';
import { TextStyle, IRTextLine } from '../../services/editorialLayoutEngine';
import { parseInlineFormatting } from '../../utils';

export interface RtlTypographyRendererProps {
  lines: IRTextLine[];
  style: TextStyle;
  bounds: { x: number; y: number; width: number; height: number };
}

export const RtlTypographyRenderer: React.FC<RtlTypographyRendererProps> = ({
  lines,
  style,
  bounds,
}) => {
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    >
      {lines.map((line, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${line.x - bounds.x}px`,
            top: `${line.y - bounds.y}px`,
            whiteSpace: 'nowrap',
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            lineHeight: `${style.lineHeight}px`,
            letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
            wordSpacing: line.wordSpacing ? `${line.wordSpacing}px` : undefined,
            fontWeight: style.fontWeight || 'normal',
            textAlign: 'right',
          }}
        >
          {parseInlineFormatting(line.text)}
        </div>
      ))}
    </div>
  );
};
