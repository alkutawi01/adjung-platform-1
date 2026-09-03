import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { VectorStroke } from '../../types';
import { PenTool, RotateCcw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { BASELINE_INSET_MOBILE } from './signatureMetrics';

type InkColor = 'Maroon' | 'Charcoal' | 'Midnight' | 'Spruce';

interface ColorOption {
  value: string;
  name: string;
  class: string;
}

const INK_COLORS: Record<InkColor, ColorOption> = {
  Maroon: { value: '#802334', name: 'Adjung Maroon', class: 'bg-adjung-maroon' },
  Charcoal: { value: '#1c1917', name: 'Charcoal Black', class: 'bg-[#1c1917]' },
  Midnight: { value: '#1e1b4b', name: 'Royal Indigo', class: 'bg-[#1e1b4b]' },
  Spruce: { value: '#064e3b', name: 'Forest Spruce', class: 'bg-[#064e3b]' }
};

export function MobileSignCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<VectorStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<VectorStroke[]>([]);
  const [inkColor, setInkColor] = useState<InkColor>('Maroon');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract Session ID from URL query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session');

  // Track resizing of canvas container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update canvas sizing and resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * scale;
    canvas.height = dimensions.height * scale;
    ctx.scale(scale, scale);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK_COLORS[inkColor].value;

    redrawCanvas();
  }, [dimensions, strokes, inkColor]);

  // Redraw path layers on state update
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK_COLORS[inkColor].value;

    strokes.forEach(stroke => {
      if (stroke.length === 0) return;

      const firstPoint = stroke[0];
      ctx.beginPath();
      ctx.arc(firstPoint.x, firstPoint.y, (firstPoint.pressure || 2.5) * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = INK_COLORS[inkColor].value;
      ctx.fill();

      for (let i = 1; i < stroke.length; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = p2.pressure || 2.5;
        ctx.stroke();
      }
    });
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): { x: number, y: number, pressure: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const coords = getCoordinates(e);
    const baseWidth = 3.5;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, baseWidth * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = INK_COLORS[inkColor].value;
      ctx.fill();
    }

    setCurrentStroke([{ x: coords.x, y: coords.y, pressure: baseWidth }]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);

    // Dynamic stroke pressure simulation
    const strokeWidth = (coords.pressure * 3.5) + 1.5;

    ctx.beginPath();
    ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = INK_COLORS[inkColor].value;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    const newPoint: VectorStroke = {
      x: coords.x,
      y: coords.y,
      pressure: Number(strokeWidth.toFixed(2))
    };
    setCurrentStroke(prev => [...prev, newPoint]);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    try {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignore invalid pointer IDs
    }

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

  const submitSignature = async () => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No active session found.');
      return;
    }

    if (strokes.length === 0) {
      setStatus('error');
      setErrorMessage('Please draw your signature before sending.');
      return;
    }

    setStatus('sending');

    try {
      const canvasHeight = dimensions?.height || 220;
      const baselineY = canvasHeight - BASELINE_INSET_MOBILE;

      const channel = supabase.channel(`signature_sync:${sessionId}`);
      await new Promise<void>((resolve, reject) => {
        channel.subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            channel
              .send({
                type: 'broadcast',
                event: 'completed',
                payload: {
                  strokes,
                  type: 'drawn',
                  timestamp: new Date().toISOString(),
                  penStyle: {
                    nibAngle: 45,
                    inkFlowWeight: 4.5,
                    inkColor,
                    baselineY,
                    canvasHeight
                  }
                }
              })
              .then(() => resolve())
              .finally(() => supabase.removeChannel(channel));
          } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
            reject(new Error('Failed to connect to sync channel.'));
          }
        });
      });
      setStatus('success');
    } catch (err: any) {
      console.error('Error submitting signature via Supabase Realtime:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to submit signature. Please try again.');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-200 text-center font-sans">
        <AlertTriangle className="w-12 h-12 text-adjung-maroon mb-4" />
        <h2 className="text-xl font-serif mb-2 text-stone-100">Invalid Sync Session</h2>
        <p className="text-stone-400 text-xs max-w-xs leading-relaxed">
          No signature synchronization session was found. Please make sure you scanned the correct QR code on the desktop registration screen.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-200 text-center font-sans">
        <CheckCircle className="w-16 h-16 text-emerald-600 mb-4 animate-bounce" />
        <h2 className="text-2xl font-serif mb-2 text-stone-100 font-normal">Signature Transmitted</h2>
        <p className="text-stone-400 text-xs max-w-xs leading-relaxed mb-8">
          Your signature has been synchronized. You can now close this browser tab and return to the desktop screen.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col text-stone-200 font-sans select-none overflow-hidden">
      {/* Standalone Header */}
      <header className="border-b border-stone-800 p-4 shrink-0 flex items-center justify-between bg-stone-900/60">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-adjung-maroon" />
          <h1 className="font-serif text-sm tracking-wide text-stone-100">Adjung Signature</h1>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(INK_COLORS).map(([colorKey, colorOpt]) => (
            <button
              key={colorKey}
              onClick={() => setInkColor(colorKey as InkColor)}
              className={`w-5 h-5 rounded-full border transition-all ${colorOpt.class} ${
                inkColor === colorKey ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              title={colorOpt.name}
            />
          ))}
        </div>
      </header>

      {/* Canvas Area with paper laid effect */}
      <div className="flex-1 relative bg-stone-900 flex flex-col p-4 justify-center items-center">
        <div className="absolute inset-0 bg-[#fdfbf7]/[0.02] pointer-events-none" />
        
        {/* Draw Instructions overlay */}
        {strokes.length === 0 && (
          <div className="absolute text-stone-600 font-sans text-center pointer-events-none select-none text-xs z-10">
            Draw your signature here
            <span className="block font-mono text-[9px] uppercase tracking-widest text-stone-700 mt-1">Touch & swipe to sign</span>
          </div>
        )}

        <div 
          ref={containerRef}
          className="w-full h-full max-h-[350px] bg-stone-900/90 border border-stone-800 rounded-md shadow-inner overflow-hidden relative cursor-crosshair touch-none"
        >
          {/* Baseline Indicator */}
          <div className="absolute left-4 right-4 bottom-12 h-px border-b border-dashed border-stone-800 pointer-events-none select-none" />
          
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="w-full h-full block"
          />
        </div>

        {status === 'error' && (
          <p className="text-red-500 font-mono text-[10px] mt-3 select-all bg-red-950/20 border border-red-900/20 px-3 py-1.5 rounded w-full max-w-sm text-center">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Action Toolbar */}
      <footer className="border-t border-stone-800 p-4 shrink-0 flex gap-4 bg-stone-900/60">
        <button
          type="button"
          onClick={clearCanvas}
          className="w-1/3 py-3 rounded-md bg-stone-800 hover:bg-stone-700 active:bg-stone-700 text-stone-300 font-mono text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-stone-700/60 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
        <button
          type="button"
          onClick={submitSignature}
          disabled={strokes.length === 0 || status === 'sending'}
          className={`w-2/3 py-3 rounded-md font-mono text-xs uppercase tracking-wider text-white transition flex items-center justify-center gap-1.5 shadow-md font-bold cursor-pointer ${
            strokes.length === 0 || status === 'sending'
              ? 'bg-stone-800 text-stone-500 border border-stone-800 shadow-none cursor-not-allowed'
              : 'bg-adjung-maroon hover:bg-[#962c3e] active:bg-[#6b1c2a]'
          }`}
        >
          {status === 'sending' ? (
            'Sending...'
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Send Signature
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
