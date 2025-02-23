import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { AudioRecorder as AudioRecorderUtil } from '@/lib/audio';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [analyserData, setAnalyserData] = useState<Uint8Array>(new Uint8Array());
  const recorderRef = useRef<AudioRecorderUtil | null>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();

  useEffect(() => {
    recorderRef.current = new AudioRecorderUtil();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateAnalyser = () => {
    if (recorderRef.current && isRecording) {
      setAnalyserData(recorderRef.current.getAnalyserData());
      animationFrameRef.current = requestAnimationFrame(updateAnalyser);
    }
  };

  const startRecording = async () => {
    if (!recorderRef.current) return;

    const success = await recorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
      setDuration(0);
      updateAnalyser();
    } else {
      toast({
        title: "Error",
        description: "Could not start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    
    const blob = await recorderRef.current.stopRecording();
    setIsRecording(false);
    if (blob) {
      onRecordingComplete(blob);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-xl shadow-lg">
      <div className="w-full">
        <AudioWaveform analyserData={analyserData} />
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          size="lg"
          className={`rounded-full w-16 h-16 ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FF4F4F] hover:bg-red-600'
          }`}
        >
          {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        
        <div className="text-xl font-mono">
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
      </div>
    </div>
  );
}
