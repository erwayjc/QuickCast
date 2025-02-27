import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder as AudioRecorderClass } from "@/lib/audio";
import { AudioWaveform } from "@/components/AudioWaveform";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [analyserData, setAnalyserData] = useState<Uint8Array>(new Uint8Array(128).fill(128));
  const { toast } = useToast();

  const recorder = useRef<AudioRecorderClass | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const audioDevices = await AudioRecorderClass.getAudioDevices();
        setDevices(audioDevices);
        if (audioDevices.length > 0) {
          setSelectedDevice(audioDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Failed to load audio devices:', error);
        toast({
          title: "Error",
          description: "Failed to load audio devices. Please check your microphone permissions.",
          variant: "destructive"
        });
      }
    };

    loadDevices();

    // Set up device change listener
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
        cleanup();
      };
    }
    return undefined;
  }, [toast]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (analyserTimerRef.current) {
      cancelAnimationFrame(analyserTimerRef.current);
    }
    if (recorder.current) {
      recorder.current.stopRecording();
    }
  };

  const updateAnalyserData = () => {
    if (!recorder.current || !isRecording) return;

    const data = recorder.current.getAnalyserData();
    setAnalyserData(data);

    analyserTimerRef.current = requestAnimationFrame(updateAnalyserData);
  };

  const startRecording = async () => {
    try {
      recorder.current = new AudioRecorderClass();
      recorder.current.setDevice(selectedDevice);
      await recorder.current.startRecording();

      setIsRecording(true);
      setRecordingTime(0);
      setAudioURL(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      updateAnalyserData();

      toast({
        title: "Recording Started",
        description: "Your microphone is now recording.",
      });
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
        toast({
          title: "Recording Complete",
          description: "Your recording has been saved successfully.",
        });
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
    cleanup();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-2xl font-semibold">
          {isRecording ? "Recording..." : "Record Episode"}
        </div>

        <div className="text-4xl font-mono mb-4">
          {formatTime(recordingTime)}
        </div>

        <div className="w-full mb-4">
          <AudioWaveform 
            analyserData={analyserData}
            duration={recordingTime}
            currentTime={recordingTime}
          />
        </div>

        <div className="flex space-x-4">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              size="lg"
              variant="default"
              className="bg-red-500 hover:bg-red-600"
              disabled={!selectedDevice}
            >
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              size="lg"
              variant="default"
              className="bg-green-500 hover:bg-green-600"
            >
              Stop Recording
            </Button>
          )}
        </div>

        {/* Microphone Selection */}
        <div className="w-full max-w-xs mt-4">
          <Select
            value={selectedDevice}
            onValueChange={setSelectedDevice}
            disabled={isRecording}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select microphone..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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