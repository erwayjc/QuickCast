import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
  analyserData: Uint8Array;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
  onTrimChange?: (start: number, end: number) => void;
  isEditable?: boolean;
}

export function AudioWaveform({ 
  analyserData, 
  duration = 0,
  trimStart = 0,
  trimEnd = duration,
  onTrimChange,
  isEditable = false 
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas with dark background
    ctx.fillStyle = '#18181B'; // zinc-900
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#3F3F46'; // zinc-700
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#10B981'); // emerald-500
    gradient.addColorStop(1, '#059669'); // emerald-600

    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const sliceWidth = width / analyserData.length;
    let x = 0;

    for (let i = 0; i < analyserData.length; i++) {
      const v = analyserData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw trim markers if editable
    if (isEditable && duration > 0) {
      const startX = (trimStart / duration) * width;
      const endX = (trimEnd / duration) * width;

      // Draw selected region
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // emerald-500 with opacity
      ctx.fillRect(startX, 0, endX - startX, height);

      // Draw trim markers
      ctx.fillStyle = '#10B981'; // emerald-500
      ctx.fillRect(startX - 2, 0, 4, height);
      ctx.fillRect(endX - 2, 0, 4, height);

      // Add draggable indicators
      const handleHeight = 20;
      ctx.fillStyle = '#fff';

      // Start handle
      ctx.beginPath();
      ctx.moveTo(startX, height/2 - handleHeight/2);
      ctx.lineTo(startX - 8, height/2);
      ctx.lineTo(startX, height/2 + handleHeight/2);
      ctx.fill();

      // End handle
      ctx.beginPath();
      ctx.moveTo(endX, height/2 - handleHeight/2);
      ctx.lineTo(endX + 8, height/2);
      ctx.lineTo(endX, height/2 + handleHeight/2);
      ctx.fill();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWaveform(ctx, canvas.width, canvas.height);
  }, [analyserData, trimStart, trimEnd, duration, isEditable]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-40 rounded-xl"
      width={800}
      height={200}
      style={{ cursor: isEditable ? 'ew-resize' : 'default' }}
    />
  );
}