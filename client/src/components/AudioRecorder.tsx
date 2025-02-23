import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  Square, 
  Save, 
  RotateCcw,
  Volume2,
  Timer,
  AlertCircle
} from 'lucide-react';
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
      const { start, end, duration } = recorderRef.current.getTrimPoints();
      setTrimStart(start);
      setTrimEnd(end);
      setDuration(duration || audioDuration || 0);
      setIsEditing(true);
      setIsAutoTrimmed(true);

      if (duration && audioDuration) {
        const trimmedDuration = end - start;
        const savedTime = audioDuration - trimmedDuration;
        if (savedTime > 0.5) { 
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
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-2xl shadow-2xl">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isRecording ? 'Recording...' : 'Ready'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="font-mono text-sm">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="relative">
          <AudioWaveform 
            analyserData={analyserData}
            duration={duration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimChange={isEditing ? handleTrimChange : undefined}
            isEditable={isEditing}
          />
          {isEditing && isAutoTrimmed && (
            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Silence automatically removed. Adjust if needed.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!isEditing ? (
            <div className="flex justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="lg"
                className={`rounded-full w-20 h-20 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isRecording ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleSaveTrim}
                size="lg"
                className="rounded-full w-16 h-16 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              >
                <Save className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 border-zinc-700 hover:bg-zinc-700"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}