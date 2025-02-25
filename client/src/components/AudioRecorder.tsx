import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder as AudioRecorderClass } from "@/lib/audio";

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const { toast } = useToast();

  const recorder = useRef<AudioRecorderClass | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      recorder.current = new AudioRecorderClass();
      const success = await recorder.current.startRecording();

      if (success) {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (!recorder.current) return;

    try {
      const audioBlob = await recorder.current.stopRecording();
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording.",
        variant: "destructive"
      });
    }

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-2xl font-semibold mb-4">
          {isRecording ? "Recording..." : "Record Episode"}
        </div>

        <div className="text-4xl font-mono mb-4">
          {formatTime(recordingTime)}
        </div>

        <div className="flex space-x-4">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              size="lg"
              variant="default"
            >
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              size="lg"
              variant="destructive"
            >
              Stop Recording
            </Button>
          )}
        </div>

        {audioURL && !isRecording && (
          <div className="mt-4">
            <audio src={audioURL} controls className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;