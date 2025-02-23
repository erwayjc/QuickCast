import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Scissors, Save, RotateCcw } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isAutoTrimmed, setIsAutoTrimmed] = useState(false);
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
      setIsEditing(false);
      setIsAutoTrimmed(false);
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
      const audioDuration = await getDuration(blob);
      // Get auto-detected trim points
      const { start, end, duration } = recorderRef.current.getTrimPoints();
      setTrimStart(start);
      setTrimEnd(end);
      setDuration(duration || audioDuration || 0);
      setIsEditing(true);
      setIsAutoTrimmed(true);

      // Show feedback about auto-trimming
      if (duration && audioDuration) {
        const trimmedDuration = end - start;
        const savedTime = audioDuration - trimmedDuration;
        if (savedTime > 0.5) { // Only show if we saved more than half a second
          toast({
            title: "Auto-trimmed",
            description: `Removed ${savedTime.toFixed(1)} seconds of silence`,
          });
        }
      }
    }
  };

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDuration = async (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(blob));
      audio.addEventListener('loadedmetadata', () => {
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
    });
  };

  const handleTrimChange = (start: number, end: number) => {
    if (!recorderRef.current) return;
    setTrimStart(start);
    setTrimEnd(end);
    recorderRef.current.setTrimPoints(start, end);
    setIsAutoTrimmed(false);
  };

  const handleSaveTrim = async () => {
    if (!recorderRef.current) return;

    const trimmedBlob = await recorderRef.current.getTrimmedAudio();
    if (trimmedBlob) {
      onRecordingComplete(trimmedBlob);
      setIsEditing(false);
      toast({
        title: "Success",
        description: isAutoTrimmed 
          ? "Recording auto-trimmed and saved successfully!"
          : "Recording trimmed and saved successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to trim the recording.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setIsEditing(false);
    setAnalyserData(new Uint8Array());
    setDuration(0);
    setIsAutoTrimmed(false);
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
        <AudioWaveform 
          analyserData={analyserData}
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          onTrimChange={isEditing ? handleTrimChange : undefined}
          isEditable={isEditing}
        />
        {isEditing && isAutoTrimmed && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Silence automatically removed. Drag markers to adjust.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!isEditing ? (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="lg"
            className={`rounded-full w-16 h-16 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FF4F4F] hover:bg-red-600'
            }`}
          >
            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSaveTrim}
              size="lg"
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
            >
              <Save className="h-6 w-6" />
            </Button>
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </>
        )}

        <div className="text-xl font-mono">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}