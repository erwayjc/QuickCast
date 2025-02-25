import { useState, useEffect, useRef } from 'react';

interface AudioPlayerHook {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  playAudio: (audioSrc: string) => void;
  pauseAudio: () => void;
  togglePlayPause: () => void;
  stopAudio: () => void;
  seekTo: (time: number) => void;
  setVolume: (level: number) => void;
}

export const useAudioPlayer = (): AudioPlayerHook => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      setIsPlaying(false);
      URL.revokeObjectURL(audio.src);
    };
  }, []);

  const playAudio = (audioSrc: string) => {
    const audio = audioRef.current;

    if (audio.src !== audioSrc) {
      audio.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      audio.src = audioSrc;
      audio.load();
    }

    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(error => {
        console.error('Error playing audio:', error);
      });
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    audio.pause();
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioRef.current.src);
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (level: number) => {
    const audio = audioRef.current;
    audio.volume = Math.max(0, Math.min(1, level));
  };

  return {
    isPlaying,
    duration,
    currentTime,
    playAudio,
    pauseAudio,
    togglePlayPause,
    stopAudio,
    seekTo,
    setVolume,
  };
};
