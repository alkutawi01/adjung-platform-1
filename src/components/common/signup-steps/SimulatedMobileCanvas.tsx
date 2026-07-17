import React, { useState, useEffect, useRef } from 'react';

interface SimulatedMobileCanvasProps {
  onSave: (strokes: any[]) => void;
  onCancel: () => void;
}

export default function SimulatedMobileCanvas({ onSave, onCancel }: SimulatedMobileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<any[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#802334';
    ctx.lineWidth = 3.5;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    const lastPoint = currentStroke[currentStroke.length - 1];
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setCurrentStroke(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStrokes([]);
  };

  return (
    <div className="bg-[#1A1816] text-stone-100 p-5 rounded-2xl max-w-[280px] w-full border border-stone-800 shadow-2xl space-y-4 font-sans select-none relative">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl" />
      
      <div className="flex justify-between items-center border-b border-stone-800/80 pt-2 pb-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-adjung-maroon font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          ADJUNG MOBILE SIGN
        </span>
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-300 text-[10px] font-mono uppercase">Close</button>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-stone-300 font-serif italic text-center font-normal">Please sign inside the following box:</p>
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-lg h-44 relative overflow-hidden">
        <div className="absolute inset-x-4 bottom-8 border-b border-stone-800/40 border-dashed pointer-events-none" />
        <canvas
          ref={canvasRef}
          width={240}
          height={176}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none"
        />
        {strokes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 text-center px-4">
            <span className="font-serif italic text-[12px] text-stone-300 font-normal">Use your finger or stylus</span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-stone-500 mt-1">Touch Screen Canvas</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={clear}
          className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px] uppercase rounded-sm transition-colors cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={() => strokes.length > 0 && onSave(strokes)}
          disabled={strokes.length === 0}
          className="flex-1 py-2 bg-adjung-maroon hover:bg-[#962c3e] disabled:opacity-40 disabled:cursor-not-allowed text-stone-100 font-mono text-[10px] uppercase rounded-sm transition-all cursor-pointer font-bold"
        >
          Send to PC
        </button>
      </div>
    </div>
  );
}
