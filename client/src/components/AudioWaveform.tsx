import React, { useRef, useEffect, useState } from 'react';

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
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF4F4F';
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
      ctx.fillStyle = 'rgba(255, 79, 79, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);

      // Draw trim markers
      ctx.fillStyle = '#FF4F4F';
      ctx.fillRect(startX - 2, 0, 4, height);
      ctx.fillRect(endX - 2, 0, 4, height);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWaveform(ctx, canvas.width, canvas.height);
  }, [analyserData, trimStart, trimEnd, duration, isEditable]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditable || !onTrimChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / canvas.width) * duration;

    // Determine if we're closer to start or end marker
    const startDistance = Math.abs(timePosition - trimStart);
    const endDistance = Math.abs(timePosition - trimEnd);

    if (startDistance < endDistance && startDistance < 1) {
      setIsDragging('start');
    } else if (endDistance < 1) {
      setIsDragging('end');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isEditable || !onTrimChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = Math.max(0, Math.min((x / canvas.width) * duration, duration));

    if (isDragging === 'start') {
      onTrimChange(Math.min(timePosition, trimEnd - 0.1), trimEnd);
    } else {
      onTrimChange(trimStart, Math.max(timePosition, trimStart + 0.1));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 rounded-lg shadow-md bg-white cursor-ew-resize"
      width={800}
      height={100}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}