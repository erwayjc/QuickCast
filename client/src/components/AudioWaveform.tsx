import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
  analyserData: Uint8Array;
}

export function AudioWaveform({ analyserData }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
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
    };

    draw();
  }, [analyserData]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 rounded-lg shadow-md bg-white"
      width={800}
      height={100}
    />
  );
}
