import React, { useRef, useState, useEffect } from 'react';
import { DigitalSignature, VectorStroke } from '../types';
import { Settings, Trash2, Sliders, Sparkles, Paintbrush, FileText, Info, Type, PenTool } from 'lucide-react';
import { db } from '../db/mockDb';

interface SignaturePadProps {
  onSave: (data: Partial<DigitalSignature>) => void;
  onCancel: () => void;
}

type PaperTexture = 'Smooth' | 'Laid' | 'Vintage';
type InkColor = 'Maroon' | 'Charcoal' | 'Midnight' | 'Spruce';

interface ColorOption {
  value: string;
  name: string;
  class: string;
}

const INK_COLORS: Record<InkColor, ColorOption> = {
  Maroon: { value: '#802334', name: 'Adjung Maroon', class: 'bg-[#802334]' },
  Charcoal: { value: '#1c1917', name: 'Charcoal Black', class: 'bg-[#1c1917]' },
  Midnight: { value: '#1e1b4b', name: 'Royal Indigo', class: 'bg-[#1e1b4b]' },
  Spruce: { value: '#064e3b', name: 'Forest Spruce', class: 'bg-[#064e3b]' }
};



const PAPER_STYLES = {
  Smooth: {
    backgroundColor: '#fafaf9',
    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  Laid: {
    backgroundColor: '#fdfbf7',
    backgroundImage: 'linear-gradient(rgba(139, 92, 26, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 26, 0.02) 1px, transparent 1px)',
    backgroundSize: '100% 14px, 120px 100%',
  },
  Vintage: {
    backgroundColor: '#f6f1e5',
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(212, 163, 115, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(188, 108, 37, 0.1) 0%, transparent 40%)',
    backgroundSize: '100% 100%',
    boxShadow: 'inset 0 0 40px rgba(139, 92, 26, 0.08)'
  }
};

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<VectorStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<VectorStroke[]>([]);
  
  // Customization states
  const allowedFonts = db.getSystemSettings().allowedSignatureFonts || [];
  const dynamicFontOptions = allowedFonts.map(f => ({ name: f, value: `${f}, cursive` }));

  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState(dynamicFontOptions[0]?.value || 'cursive');
  const [inkFlowWeight, setInkFlowWeight] = useState<number>(4.0);
  const [nibAngle, setNibAngle] = useState<number>(45); // 0 (round), 30, 45, 60
  const [paperTexture, setPaperTexture] = useState<PaperTexture>('Laid');
  const [inkColor, setInkColor] = useState<InkColor>('Maroon');
  const [smoothingFactor, setSmoothingFactor] = useState<number>(0.22); // alpha parameter
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [fontWeight, setFontWeight] = useState<number>(400);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [simulatedPressure, setSimulatedPressure] = useState<number>(2.0); // UI feedback

  // Physics & Smoothing Refs
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastVelocityRef = useRef<number>(0);
  const lastWidthRef = useRef<number>(2.0);
  const strokeLengthRef = useRef<number>(0);

  // Setup canvas for high-DPI displays & update line colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Maintain state strokes by re-drawing if dimensions match, 
    // but in a typical resize we just clear.
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK_COLORS[inkColor].value;
    
    redrawCanvas();
  }, [strokes, inkColor]);

  // Re-draw all strokes whenever states change (especially inkColor or visual settings)
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
      
      // Draw first point as a pooling circle
      const firstPoint = stroke[0];
      ctx.beginPath();
      ctx.arc(firstPoint.x, firstPoint.y, (firstPoint.pressure || 2.0) * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = INK_COLORS[inkColor].value;
      ctx.fill();

      // Draw segments
      for (let i = 1; i < stroke.length; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        // Dynamic stroke width based on stored pressure
        ctx.lineWidth = p2.pressure || 2.0;
        ctx.stroke();
      }
    });
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): { x: number, y: number, pressure: number, pointerType: string } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, pointerType: 'mouse' };
    
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
      pointerType: e.pointerType
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    
    const coords = getCoordinates(e);
    
    // Physics initialization
    lastPointRef.current = { x: coords.x, y: coords.y };
    lastTimeRef.current = Date.now();
    lastVelocityRef.current = 0;
    
    const baseWidth = (inkFlowWeight / 4.0) * 2.0;
    lastWidthRef.current = baseWidth;
    strokeLengthRef.current = 0;

    // Draw ink pool at start point
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
    if (!canvas || !ctx || !lastPointRef.current) return;
    
    const coords = getCoordinates(e);
    const now = Date.now();
    const timeDelta = Math.max(1, now - lastTimeRef.current);
    
    // 1. Calculate Velocity & Direction
    const dx = coords.x - lastPointRef.current.x;
    const dy = coords.y - lastPointRef.current.y;
    const distance = Math.hypot(dx, dy);
    
    // Skip tiny sub-pixel tremors to stabilize lines
    if (distance < 0.5) return;
    
    const velocity = distance / timeDelta;
    strokeLengthRef.current += distance;
    
    // 2. Ink Flow Weight Multiplier
    const weightMultiplier = inkFlowWeight / 4.0;
    const velocityImpact = Math.max(
      0.35 * weightMultiplier, 
      Math.min(2.5 * weightMultiplier, (1.8 - (velocity * 0.54)) * weightMultiplier)
    );
    
    // 3. Stylus Pressure vs Mouse/Touch Physics
    let targetPressure = velocityImpact;
    if (coords.pointerType === 'pen' && coords.pressure > 0) {
      // Native stylus pressure integrated with velocity physics
      targetPressure = (velocityImpact * 0.4) + (coords.pressure * 2.0 * weightMultiplier);
    }
    
    // 4. Fountain Pen Nib Angle Impact (Chisel Nib Physics)
    if (nibAngle > 0) {
      const theta = Math.atan2(dy, dx);
      const angleRad = (nibAngle * Math.PI) / 180;
      const delta = theta - angleRad;
      // Perpendicular to nib angle is thickest, parallel is thinnest
      const nibMultiplier = 0.35 + 0.65 * Math.abs(Math.sin(delta));
      targetPressure = targetPressure * nibMultiplier;
    }

    // 5. Ink Depletion (fade slightly on extremely long continuous strokes)
    if (strokeLengthRef.current > 1500) {
      const depletion = Math.max(0.2, 1.0 - (strokeLengthRef.current - 1500) / 1000);
      targetPressure = targetPressure * depletion;
    }
    
    // 6. Double Exponential Smoothing (alpha parameter)
    const alpha = smoothingFactor;
    const smoothedPressure = lastWidthRef.current * (1 - alpha) + targetPressure * alpha;
    
    // Update live feedback state for UI dashboard
    setSimulatedPressure(smoothedPressure);

    // Draw the segment on canvas
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = INK_COLORS[inkColor].value;
    ctx.lineWidth = smoothedPressure;
    ctx.stroke();
    
    // Store point
    const newPoint: VectorStroke = { 
      x: coords.x, 
      y: coords.y, 
      pressure: Number(smoothedPressure.toFixed(2)) 
    };
    setCurrentStroke(prev => [...prev, newPoint]);
    
    // Update refs
    lastPointRef.current = { x: coords.x, y: coords.y };
    lastTimeRef.current = now;
    lastVelocityRef.current = velocity;
    lastWidthRef.current = smoothedPressure;
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
      // Ignore if pointerId is invalid
    }
    
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
    lastPointRef.current = null;
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

  const handlePresetSelect = (preset: 'fountain' | 'calligraphy' | 'gel') => {
    if (preset === 'fountain') {
      setNibAngle(45);
      setInkFlowWeight(4.5);
      setPaperTexture('Laid');
      setSmoothingFactor(0.22);
    } else if (preset === 'calligraphy') {
      setNibAngle(60);
      setInkFlowWeight(5.5);
      setPaperTexture('Vintage');
      setSmoothingFactor(0.18);
    } else {
      setNibAngle(0); // Round pen
      setInkFlowWeight(3.0);
      setPaperTexture('Smooth');
      setSmoothingFactor(0.3);
    }
  };

  const currentPaperStyle = PAPER_STYLES[paperTexture];

  const handleSaveSignature = () => {
    if (signatureMode === 'draw') {
      onSave({ strokes, type: 'drawn' });
    } else {
      onSave({ strokes: [], type: 'typed', typedText, fontFamily: selectedFont, typographyStyle: { letterSpacing, fontWeight } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-stone-950/80 backdrop-blur-sm">
      <div className="flex flex-col xl:flex-row gap-6 bg-stone-900 border border-stone-800 rounded-lg p-5 shadow-2xl text-stone-200 w-full max-w-5xl max-h-full overflow-y-auto">
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="w-full xl:w-80 flex flex-col gap-5 border-b xl:border-b-0 xl:border-r border-stone-800 pb-5 xl:pb-0 xl:pr-5 select-none">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-widest text-Adjung-maroon font-bold flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Studio Controls
            </h3>
            <span className="font-mono text-[9px] uppercase bg-stone-850 px-2 py-0.5 rounded text-stone-400">
              {signatureMode === 'draw' ? 'Interactive Physics' : 'Typography'}
            </span>
          </div>

          {signatureMode === 'draw' ? (
            <>
              {/* Preset Buttons */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400">Presets</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('fountain')}
                    className={`py-1 px-2 text-[10px] font-mono rounded uppercase tracking-wider border transition ${
                      nibAngle === 45 && inkFlowWeight === 4.5
                        ? 'border-Adjung-maroon bg-Adjung-maroon/10 text-white' 
                        : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                    }`}
                  >
                    Fountain
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('calligraphy')}
                    className={`py-1 px-2 text-[10px] font-mono rounded uppercase tracking-wider border transition ${
                      nibAngle === 60 && inkFlowWeight === 5.5
                        ? 'border-Adjung-maroon bg-Adjung-maroon/10 text-white' 
                        : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                    }`}
                  >
                    Chisel
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('gel')}
                    className={`py-1 px-2 text-[10px] font-mono rounded uppercase tracking-wider border transition ${
                      nibAngle === 0 && inkFlowWeight === 3.0
                        ? 'border-Adjung-maroon bg-Adjung-maroon/10 text-white' 
                        : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                    }`}
                  >
                    Gel Pen
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {/* Ink Flow Weight */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    <span>Ink Flow Weight</span>
                    <span className="text-Adjung-maroon font-bold">{inkFlowWeight.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={inkFlowWeight}
                    onChange={(e) => setInkFlowWeight(parseFloat(e.target.value))}
                    className="w-full accent-Adjung-maroon bg-stone-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Nib Angle */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    <span>Nib Profile Angle</span>
                    <span className="text-Adjung-maroon font-bold">{nibAngle === 0 ? 'Round' : `${nibAngle}°`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="15"
                    value={nibAngle}
                    onChange={(e) => setNibAngle(parseInt(e.target.value))}
                    className="w-full accent-Adjung-maroon bg-stone-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Smoothing Factor */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    <span>Double Smoothing</span>
                    <span className="text-Adjung-maroon font-bold">{Math.round((1 - smoothingFactor) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.6"
                    step="0.01"
                    value={smoothingFactor}
                    onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))}
                    className="w-full accent-Adjung-maroon bg-stone-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-stone-900/50 border border-stone-800 p-4 rounded text-[10px] text-stone-400 font-mono leading-relaxed">
                <span className="block text-Adjung-maroon font-bold mb-2">Typography Mode</span>
                Physics simulation disabled. Adjust typography settings below to refine your digital signature.
              </div>

              {/* Typography Sliders */}
              <div className="space-y-4">
                {/* Font Weight */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    <span>Font Weight (Thickness)</span>
                    <span className="text-Adjung-maroon font-bold">{fontWeight}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="100"
                    value={fontWeight}
                    onChange={(e) => setFontWeight(parseInt(e.target.value))}
                    className="w-full accent-Adjung-maroon bg-stone-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400">
                    <span>Letter Spacing</span>
                    <span className="text-Adjung-maroon font-bold">{letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="15"
                    step="0.5"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                    className="w-full accent-Adjung-maroon bg-stone-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}



          {/* Paper Texture Selector */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400">Paper Texture</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Smooth', 'Laid', 'Vintage'] as PaperTexture[]).map((tex) => (
                <button
                  key={tex}
                  type="button"
                  onClick={() => setPaperTexture(tex)}
                  className={`py-1 px-1.5 text-[9px] font-mono rounded uppercase tracking-wider border transition ${
                    paperTexture === tex 
                      ? 'border-Adjung-maroon bg-Adjung-maroon/10 text-white' 
                      : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                  }`}
                >
                  {tex}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time statistics telemetry */}
          {signatureMode === 'draw' ? (
            <div className="mt-auto bg-stone-950/60 p-2.5 rounded border border-stone-850 flex flex-col gap-1 text-[9px] font-mono text-stone-500">
              <span className="uppercase text-stone-400 font-bold mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-Adjung-maroon" /> Physical Telemetry
              </span>
              <div className="flex justify-between">
                <span>Dynamic Width:</span>
                <span className="text-stone-300">{simulatedPressure.toFixed(2)}px</span>
              </div>
              <div className="flex justify-between">
                <span>Points Captured:</span>
                <span className="text-stone-300">
                  {strokes.reduce((acc, stroke) => acc + stroke.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Input Mode:</span>
                <span className="text-stone-300 font-bold uppercase">
                  {strokes.length > 0 ? 'Pointer Capture' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-auto bg-stone-950/60 p-2.5 rounded border border-stone-850 flex flex-col gap-1 text-[9px] font-mono text-stone-500">
              <span className="uppercase text-stone-400 font-bold mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-Adjung-maroon" /> Typography Telemetry
              </span>
              <div className="flex justify-between">
                <span>Font Stack:</span>
                <span className="text-stone-300 text-right max-w-[120px] truncate" title={selectedFont}>{selectedFont.split(',')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters:</span>
                <span className="text-stone-300">{typedText.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Input Mode:</span>
                <span className="text-stone-300 font-bold uppercase">
                  Keyboard
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Mode Toggle */}
        <div className="flex bg-stone-950/30 p-1 rounded border border-stone-850 w-fit">
          <button 
            type="button"
            onClick={() => setSignatureMode('draw')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition ${
              signatureMode === 'draw' ? 'bg-stone-800 text-stone-200' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw
          </button>
          <button 
            type="button"
            onClick={() => setSignatureMode('type')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition ${
              signatureMode === 'type' ? 'bg-stone-800 text-stone-200' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Type
          </button>
        </div>

        {signatureMode === 'draw' ? (
          <>
            {/* Canvas Toolbar Header */}
            <div className="flex justify-between items-center bg-stone-950/30 p-2 rounded border border-stone-850">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1 rounded transition ${showSettings ? 'text-Adjung-maroon bg-Adjung-maroon/10' : 'text-stone-400 hover:text-stone-250'}`}
                  title="Toggle settings panel"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-mono tracking-widest uppercase text-stone-400 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5" /> Calligraphy Studio
                </div>
              </div>
              
              <button 
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-stone-400 hover:text-red-400 uppercase tracking-wider transition bg-stone-900 border border-stone-800 rounded"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>

            {/* Paper Canvas */}
            <div 
              style={currentPaperStyle}
              className="relative border border-stone-800 rounded-lg overflow-hidden cursor-crosshair select-none transition-all duration-300 h-64 md:h-72 shadow-inner"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-full touch-none"
              />
              
              {/* Elegant baseline guideline */}
              <div className="absolute left-6 right-6 bottom-16 border-b border-dashed border-stone-300/40 pointer-events-none flex justify-between items-end select-none">
                <span className="font-mono text-[8px] tracking-widest text-stone-400/30 uppercase pb-1">Signature baseline</span>
                <span className="font-serif text-[11px] italic text-stone-400/20 pb-0.5">Adjung studio</span>
              </div>

              {strokes.length === 0 && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-20 transition-all select-none">
                  <span className="font-serif text-3xl italic tracking-wide text-stone-600">Sign Here</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mt-2">
                    Supports pressure & stylus velocity
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-4">

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Your Name / Signature Text</label>
              <input 
                type="text" 
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your signature..."
                className="bg-stone-900 border border-stone-800 rounded p-3 text-stone-200 focus:outline-none focus:border-Adjung-maroon transition font-serif text-lg"
              />
            </div>
            
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              <label className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Select Font Style</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {dynamicFontOptions.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setSelectedFont(font.value)}
                    className={`p-3 border rounded text-left transition h-28 flex flex-col ${
                      selectedFont === font.value 
                        ? 'border-Adjung-maroon bg-Adjung-maroon/10 text-white' 
                        : 'border-stone-800 hover:bg-stone-800 text-stone-400'
                    }`}
                  >
                    <span className="block text-[10px] font-mono uppercase tracking-widest mb-2 opacity-50">{font.name}</span>
                    <span 
                      style={{ fontFamily: font.value, fontSize: '32px', color: INK_COLORS[inkColor].value }} 
                      className="truncate w-full leading-none mt-auto pb-2"
                    >
                      {typedText || 'Signature'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div 
              style={currentPaperStyle}
              className="relative mt-2 border border-stone-800 rounded-lg overflow-hidden flex items-center justify-center h-40 shadow-inner shrink-0"
            >
               <span 
                 style={{ fontFamily: selectedFont, fontSize: '48px', color: INK_COLORS[inkColor].value, letterSpacing: `${letterSpacing}px`, fontWeight }}
                 className={`transition-all ${!typedText ? 'opacity-30' : ''}`}
               >
                 {typedText || 'Sign Here'}
               </span>
               <div className="absolute left-6 right-6 bottom-8 border-b border-dashed border-stone-300/40 pointer-events-none flex justify-between items-end select-none">
                 <span className="font-mono text-[8px] tracking-widest text-stone-400/30 uppercase pb-1">Signature baseline</span>
               </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono">
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>Draw slowly for thicker ink flow</span>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-stone-800 text-stone-400 rounded text-xs font-mono uppercase tracking-wider hover:bg-stone-850 hover:text-stone-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSignature}
              disabled={signatureMode === 'draw' ? strokes.length === 0 : typedText.length === 0}
              className="px-4 py-2 bg-Adjung-maroon text-[#FDFDFD] rounded text-xs font-mono uppercase tracking-wider hover:bg-opacity-95 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              Save Signature
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
