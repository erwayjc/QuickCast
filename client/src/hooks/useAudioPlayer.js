import { useState, useEffect, useRef } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    // Event listeners for the audio element
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

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Cleanup function
    return () => {
      // Remove event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);

      // Pause and reset audio when component unmounts
      audio.pause();
      setIsPlaying(false);
      URL.revokeObjectURL(audio.src); // Clean up any object URLs
    };
  }, []);

  // Function to play audio
  const playAudio = (audioSrc) => {
    const audio = audioRef.current;

    // If we're changing the audio source, pause the current one
    if (audio.src !== audioSrc) {
      audio.pause();
      setIsPlaying(false);
      setCurrentTime(0);

      // Update source and load
      audio.src = audioSrc;
      audio.load();
    }

    // Play the audio
    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(error => {
        console.error('Error playing audio:', error);
      });
  };

  // Function to pause audio
  const pauseAudio = () => {
    const audio = audioRef.current;
    audio.pause();
    setIsPlaying(false);
  };

  // Function to toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioRef.current.src);
    }
  };

  // Function to stop audio
  const stopAudio = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Function to seek to a specific time
  const seekTo = (time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Function to set volume (0 to 1)
  const setVolume = (level) => {
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