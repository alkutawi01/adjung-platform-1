import React, { useRef, useState, useEffect } from 'react';
import { VectorStroke } from '../types';

interface SignaturePadProps {
  onSave: (strokes: VectorStroke[][]) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<VectorStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<VectorStroke[]>([]);

  // Setup canvas for high-DPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual size in memory (scaled to account for extra pixel density)
    const scale = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    
    ctx.scale(scale, scale);
    
    // Set line style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#802334'; // adjung-maroon
    ctx.lineWidth = 2;
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
    
    setCurrentStroke([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    
    setCurrentStroke(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStrokes([]);
    setCurrentStroke([]);
  };

  return (
    <div className="border border-stone-200 rounded p-4 bg-white flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-stone-500">Digital Signature Pad</h3>
        <button 
          onClick={clearCanvas}
          className="text-[10px] font-mono text-stone-400 hover:text-stone-800 uppercase tracking-wider"
        >
          Clear
        </button>
      </div>
      
      <div className="relative border border-dashed border-stone-300 rounded bg-stone-50/50 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 touch-none"
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <span className="font-serif text-3xl italic">Sign Here</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-stone-200 text-stone-600 rounded text-xs font-mono uppercase tracking-wider hover:bg-stone-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(strokes)}
          disabled={strokes.length === 0}
          className="px-4 py-2 bg-adjung-maroon text-[#FDFDFD] rounded text-xs font-mono uppercase tracking-wider hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
