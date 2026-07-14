import { Entry, EntryLayoutVariant } from '../types';
import { BLOCK_SPECIFICATIONS, BlockConstraint } from '../config/blockSpecifications';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: string | number;
  letterSpacing?: number;
}

export type EditorialPrimitiveType = 'Text' | 'Signature' | 'Footnote' | 'PullQuote';

export interface BasePrimitive {
  id: string;
  type: EditorialPrimitiveType;
}

export interface TextPrimitive extends BasePrimitive {
  type: 'Text';
  content: string;
  style: TextStyle;
}

export interface SignaturePrimitive extends BasePrimitive {
  type: 'Signature';
  signerName: string;
  style: TextStyle;
  height: number;
}

export interface FootnotePrimitive extends BasePrimitive {
  type: 'Footnote';
  index: number;
  content: string;
  style: TextStyle;
}

export interface PullQuotePrimitive extends BasePrimitive {
  type: 'PullQuote';
  content: string;
  author?: string;
  style: TextStyle;
}

export type EditorialPrimitive =
  | TextPrimitive
  | SignaturePrimitive
  | FootnotePrimitive
  | PullQuotePrimitive;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IRTextLine {
  text: string;
  x: number;
  y: number;
  wordSpacing?: number;
}

export interface IRTextNode {
  type: 'Text';
  lines: IRTextLine[];
  style: TextStyle;
}

export interface IRSignatureNode {
  type: 'Signature';
  signerName: string;
  style: TextStyle;
  bounds: BoundingBox;
}

export interface IRFootnoteNode {
  type: 'Footnote';
  index: number;
  lines: IRTextLine[];
  style: TextStyle;
}

export interface IRPullQuoteNode {
  type: 'PullQuote';
  lines: IRTextLine[];
  authorLines: IRTextLine[];
  style: TextStyle;
  bounds: BoundingBox;
}

export type IRNode = {
  id: string;
  node: IRTextNode | IRSignatureNode | IRFootnoteNode | IRPullQuoteNode;
  bounds: BoundingBox;
};

export interface EditorialLayoutIR {
  width: number;
  height: number;
  nodes: IRNode[];
}

export interface TypographyMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
}

export interface ITypographyMetricsProvider {
  measureText(text: string, style: TextStyle): TypographyMetrics;
}

export interface IEditorialLayoutEngine {
  computeLayout(
    primitives: EditorialPrimitive[],
    constraints: BoundingBox,
    layoutVariant?: string
  ): EditorialLayoutIR;
}

export class CanvasTypographyMetricsProvider implements ITypographyMetricsProvider {
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      this.ctx = canvas.getContext('2d');
    }
  }

  public measureText(text: string, style: TextStyle): TypographyMetrics {
    const computedLineHeight = style.lineHeight <= 3 ? style.fontSize * style.lineHeight : style.lineHeight;

    if (!this.ctx) {
      return {
        width: text.length * style.fontSize * 0.6,
        height: computedLineHeight,
        ascent: style.fontSize * 0.8,
        descent: style.fontSize * 0.2,
      };
    }

    const weight = style.fontWeight || 'normal';
    const letterSpacingStr = style.letterSpacing ? `${style.letterSpacing}px` : 'normal';
    this.ctx.font = `${weight} ${style.fontSize}px ${style.fontFamily}`;
    
    if ('letterSpacing' in this.ctx) {
      (this.ctx as any).letterSpacing = letterSpacingStr;
    }

    const metrics = this.ctx.measureText(text);
    const width = metrics.width;
    const ascent = metrics.actualBoundingBoxAscent || style.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || style.fontSize * 0.2;

    return {
      width,
      height: computedLineHeight,
      ascent,
      descent,
    };
  }
}

export class EditorialLayoutEngine implements IEditorialLayoutEngine {
  private metricsProvider: ITypographyMetricsProvider;

  constructor(metricsProvider: ITypographyMetricsProvider) {
    this.metricsProvider = metricsProvider;
  }

  public computeLayout(
    primitives: EditorialPrimitive[],
    constraints: BoundingBox,
    layoutVariant?: string
  ): EditorialLayoutIR {
    const PRIMITIVE_PRIORITY: Record<EditorialPrimitiveType, number> = {
      Text: 4,
      Footnote: 2,
      PullQuote: 1,
      Signature: 0,
    };

    let currentPrimitives = [...primitives];

    while (true) {
      const result = this.computeLayoutInternal(currentPrimitives, constraints, layoutVariant);

      if (layoutVariant === 'penuh' || layoutVariant === 'Full') {
        return result;
      }

      const hasSignature = currentPrimitives.some(p => p.type === 'Signature');
      const hasPullQuote = currentPrimitives.some(p => p.type === 'PullQuote');
      const hasFootnote = currentPrimitives.some(p => p.type === 'Footnote');

      const layoutHasSignature = result.nodes.some(n => n.node.type === 'Signature');
      const layoutHasPullQuote = result.nodes.some(n => n.node.type === 'PullQuote');
      const layoutHasFootnote = result.nodes.some(n => n.node.type === 'Footnote');

      const signatureDropped = hasSignature && !layoutHasSignature;
      const pullQuoteDropped = hasPullQuote && !layoutHasPullQuote;
      const footnoteDropped = hasFootnote && !layoutHasFootnote;
      
      const isTextTruncated = result.isTextTruncated;

      const overflowed = signatureDropped || pullQuoteDropped || footnoteDropped || isTextTruncated;

      if (overflowed) {
        const prunables = currentPrimitives.filter(p => PRIMITIVE_PRIORITY[p.type] < 4);
        if (prunables.length > 0) {
          prunables.sort((a, b) => PRIMITIVE_PRIORITY[a.type] - PRIMITIVE_PRIORITY[b.type]);
          const toPrune = prunables[0];
          currentPrimitives = currentPrimitives.filter(p => p.id !== toPrune.id);
          continue;
        }
      }

      return result;
    }
  }

  private computeLayoutInternal(
    primitives: EditorialPrimitive[],
    constraints: BoundingBox,
    layoutVariant?: string
  ): EditorialLayoutIR & { isTextTruncated: boolean } {
    const nodes: IRNode[] = [];
    let isTextTruncated = false;

    const isFullView = layoutVariant === 'penuh' || layoutVariant === 'Full';

    const signaturePrimitives = primitives.filter(
      (p): p is SignaturePrimitive => p.type === 'Signature'
    );
    const signature = signaturePrimitives[0];

    let contentBox: BoundingBox;
    
    if (isFullView) {
      contentBox = {
        x: constraints.x,
        y: constraints.y,
        width: constraints.width,
        height: 999999,
      };
    } else {
      let reservedHeight = 0;
      if (signature) {
        reservedHeight = signature.height + 16;
      }
      
      contentBox = {
        x: constraints.x,
        y: constraints.y,
        width: constraints.width,
        height: constraints.height - reservedHeight,
      };
    }

    const contentPrimitives = primitives.filter(
      (p) => p.type !== 'Signature'
    );

    let currentY = contentBox.y;

    for (const primitive of contentPrimitives) {
      const availableHeight = contentBox.y + contentBox.height - currentY;
      if (availableHeight <= 0) {
        continue;
      }

      if (primitive.type === 'Text') {
        const textPrimitive = primitive as TextPrimitive;
        
        const textResult = this.layoutText(
          textPrimitive.content,
          textPrimitive.style,
          contentBox.x,
          currentY,
          contentBox.width,
          availableHeight
        );

        if (textResult.lines.length > 0) {
          nodes.push({
            id: textPrimitive.id,
            bounds: {
              x: contentBox.x,
              y: currentY,
              width: contentBox.width,
              height: textResult.height,
            },
            node: {
              type: 'Text',
              lines: textResult.lines,
              style: textPrimitive.style,
            },
          });
          currentY += textResult.height;
        }

        if (textResult.truncated && !isFullView) {
          isTextTruncated = true;
        }
      } else if (primitive.type === 'Footnote') {
        const footnote = primitive as FootnotePrimitive;
        const prefix = `[${footnote.index}] `;
        
        const textResult = this.layoutText(
          prefix + footnote.content,
          footnote.style,
          contentBox.x,
          currentY,
          contentBox.width,
          availableHeight
        );

        if ((!textResult.truncated || isFullView) && textResult.lines.length > 0) {
          nodes.push({
            id: footnote.id,
            bounds: {
              x: contentBox.x,
              y: currentY,
              width: contentBox.width,
              height: textResult.height,
            },
            node: {
              type: 'Footnote',
              index: footnote.index,
              lines: textResult.lines,
              style: footnote.style,
            },
          });
          currentY += textResult.height;
        }
      } else if (primitive.type === 'PullQuote') {
        const pullQuote = primitive as PullQuotePrimitive;
        
        const quoteResult = this.layoutText(
          `"${pullQuote.content}"`,
          pullQuote.style,
          contentBox.x + 20, 
          currentY,
          contentBox.width - 40,
          availableHeight
        );

        if ((!quoteResult.truncated || isFullView) && quoteResult.lines.length > 0) {
          let authorHeight = 0;
          let authorLines: IRTextLine[] = [];
          if (pullQuote.author) {
            const authorStyle = {
              ...pullQuote.style,
              fontSize: Math.max(10, pullQuote.style.fontSize - 2),
            };
            const authorResult = this.layoutText(
              `— ${pullQuote.author}`,
              authorStyle,
              contentBox.x + 20,
              currentY + quoteResult.height + 4,
              contentBox.width - 40,
              availableHeight - quoteResult.height - 4
            );
            if ((!authorResult.truncated || isFullView) && authorResult.lines.length > 0) {
              authorHeight = authorResult.height + 4;
              authorLines = authorResult.lines;
            }
          }

          const totalHeight = quoteResult.height + authorHeight;

          nodes.push({
            id: pullQuote.id,
            bounds: {
              x: contentBox.x,
              y: currentY,
              width: contentBox.width,
              height: totalHeight,
            },
            node: {
              type: 'PullQuote',
              lines: quoteResult.lines,
              authorLines,
              style: pullQuote.style,
              bounds: {
                x: contentBox.x,
                y: currentY,
                width: contentBox.width,
                height: totalHeight,
              },
            },
          });

          currentY += totalHeight;
        }
      }
    }

    if (signature) {
      let sigY: number;
      if (isFullView) {
        sigY = currentY + 24;
        currentY = sigY + signature.height;
      } else {
        sigY = constraints.y + constraints.height - signature.height;
      }

      const sigBounds: BoundingBox = {
        x: constraints.x,
        y: sigY,
        width: constraints.width,
        height: signature.height,
      };

      nodes.push({
        id: signature.id,
        bounds: sigBounds,
        node: {
          type: 'Signature',
          signerName: signature.signerName,
          style: signature.style,
          bounds: sigBounds,
        },
      });
    }

    const finalHeight = isFullView 
      ? currentY + constraints.y 
      : constraints.height + constraints.y * 2;

    return {
      width: constraints.width + constraints.x * 2,
      height: finalHeight,
      nodes,
      isTextTruncated,
    };
  }

  private layoutText(
    text: string,
    style: TextStyle,
    startX: number,
    startY: number,
    maxWidth: number,
    maxHeight: number
  ): { lines: IRTextLine[]; height: number; truncated: boolean } {
    const lines: IRTextLine[] = [];
    const words = text.split(/(\s+)/);
    
    const metricsForStyle = this.metricsProvider.measureText('', style);
    const lineHeight = metricsForStyle.height;
    
    let currentLineText = '';
    let currentY = startY;
    let wordIndex = 0;

    while (wordIndex < words.length) {
      const remainingHeight = (startY + maxHeight) - currentY;
      if (remainingHeight < lineHeight) {
        this.applyEllipsisAndTruncation(lines, maxWidth, style);
        return {
          lines,
          height: currentY - startY,
          truncated: true,
        };
      }

      const word = words[wordIndex];
      const testLine = currentLineText + word;
      const metrics = this.metricsProvider.measureText(testLine.trim(), style);

      if (metrics.width <= maxWidth) {
        currentLineText = testLine;
        wordIndex++;
      } else {
        if (currentLineText.trim() === '') {
          currentLineText = word;
          wordIndex++;
        }
        
        const lineText = currentLineText.trim();
        const lineMetrics = this.metricsProvider.measureText(lineText, style);
        const delta = maxWidth - lineMetrics.width;
        const wordsInLine = lineText.split(/\s+/).filter(Boolean);
        const spaceCount = wordsInLine.length - 1;
        let wordSpacing = 0;
        if (spaceCount > 0 && delta > 0) {
          wordSpacing = delta / spaceCount;
        }

        lines.push({
          text: lineText,
          x: startX,
          y: currentY,
          wordSpacing: wordSpacing > 0 ? wordSpacing : undefined,
        });

        currentLineText = '';
        currentY += lineHeight;
      }
    }

    if (currentLineText.length > 0) {
      const remainingHeight = (startY + maxHeight) - currentY;
      if (remainingHeight < lineHeight) {
        this.applyEllipsisAndTruncation(lines, maxWidth, style);
        return {
          lines,
          height: currentY - startY,
          truncated: true,
        };
      }

      lines.push({
        text: currentLineText.trim(),
        x: startX,
        y: currentY,
      });
      currentY += lineHeight;
    }

    return {
      lines,
      height: currentY - startY,
      truncated: false,
    };
  }

  private applyEllipsisAndTruncation(
    lines: IRTextLine[],
    maxWidth: number,
    style: TextStyle
  ): void {
    if (lines.length === 0) return;

    const lastLine = lines[lines.length - 1];
    let originalText = lastLine.text;
    const ellipsis = '...';

    lastLine.wordSpacing = undefined;

    const ellipsisWidth = this.metricsProvider.measureText(ellipsis, style).width;

    if (ellipsisWidth > maxWidth) {
      lastLine.text = '';
      return;
    }

    let low = 0;
    let high = originalText.length;
    let bestFitText = '';

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testSubstring = originalText.substring(0, mid);
      const measured = this.metricsProvider.measureText(testSubstring, style);

      if (measured.width + ellipsisWidth <= maxWidth) {
        bestFitText = testSubstring;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    lastLine.text = bestFitText + ellipsis;
  }
}

export function compileEntryToLayout(
  entry: Entry,
  authorName: string,
  variantOverride?: EntryLayoutVariant
): EditorialLayoutIR {
  const variant = variantOverride || entry.layoutVariant || 'menegak';
  const spec: BlockConstraint = BLOCK_SPECIFICATIONS[variant] || BLOCK_SPECIFICATIONS['menegak'];
  const { width, height, paddingX, paddingY } = spec;

  const provider = new CanvasTypographyMetricsProvider();
  const engine = new EditorialLayoutEngine(provider);

  const primitives: EditorialPrimitive[] = [];

  const fullContent = `${entry.title}\n\n${entry.content}`;
  primitives.push({
    id: 'text-content',
    type: 'Text',
    content: fullContent,
    style: {
      fontFamily: entry.direction === 'rtl' ? 'Traditional Arabic, Amiri, serif' : 'Georgia, serif',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: 300,
    },
  });

  if (entry.footnotesData && entry.footnotesData.length > 0) {
    entry.footnotesData.forEach((fn, idx) => {
      primitives.push({
        id: `footnote-${fn.id}`,
        type: 'Footnote',
        index: idx + 1,
        content: fn.content,
        style: {
          fontFamily: entry.direction === 'rtl' ? 'Traditional Arabic, Amiri, serif' : 'Georgia, serif',
          fontSize: 12,
          lineHeight: 18,
          fontWeight: 300,
        },
      });
    });
  }

  if (authorName || entry.publisher) {
    primitives.push({
      id: 'signature',
      type: 'Signature',
      signerName: authorName || entry.publisher || 'Author',
      style: {
        fontFamily: 'cursive',
        fontSize: 16,
        lineHeight: 24,
      },
      height: 60,
    });
  }

  const constraints: BoundingBox = {
    x: paddingX,
    y: paddingY,
    width: width - paddingX * 2,
    height: height - paddingY * 2,
  };

  return engine.computeLayout(primitives, constraints, variant);
}
