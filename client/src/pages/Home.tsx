import React, { useState, useEffect, useRef } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Episode } from '@shared/schema';

export default function Home() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(128).fill(128));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRecordingComplete = async (blob: Blob) => {
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', blob, 'episode.webm');

      // First, upload the audio file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const { audioUrl } = await uploadResponse.json();

      // Then create the episode with the permanent URL
      const episode = await apiRequest('POST', '/api/episodes', {
        title: `Episode ${new Date().toLocaleDateString()}`,
        audioUrl,
        duration: Math.floor(blob.size / 16000), // Approximate duration
        hasIntro: false,
        hasOutro: false,
        status: 'draft'
      });

      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      setCurrentEpisode(await episode.json());

      toast({
        title: "Success",
        description: "Episode recorded successfully!",
      });
    } catch (err) {
      console.error('Error saving episode:', err);
      toast({
        title: "Error",
        description: "Failed to save episode",
        variant: "destructive"
      });
    }
  };

  const handlePlay = async (episode: Episode) => {
    try {
      if (audioPlayer) {
        audioPlayer.pause();
      }

      const player = new Audio(episode.audioUrl);

      // Add error handling for audio loading
      player.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast({
          title: "Error",
          description: "Failed to play audio. The file might be missing or corrupted.",
          variant: "destructive"
        });
        setIsPlaying(false);
      };

      // Wait for the audio to be loaded before playing
      await new Promise((resolve, reject) => {
        player.oncanplaythrough = resolve;
        player.onerror = reject;
        player.load();
      });

      player.addEventListener('play', () => setIsPlaying(true));
      player.addEventListener('pause', () => setIsPlaying(false));
      player.addEventListener('ended', () => setIsPlaying(false));

      await player.play();
      setAudioPlayer(player);
      setCurrentEpisode(episode);
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing audio:', err);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
    }
  };

  const handlePause = () => {
    audioPlayer?.pause();
    setIsPlaying(false);
  };

  const handlePublish = async () => {
    if (!currentEpisode) return;

    try {
      const response = await apiRequest('PATCH', `/api/episodes/${currentEpisode.id}/publish`);
      const publishedEpisode = await response.json();

      setCurrentEpisode(publishedEpisode);
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });

      toast({
        title: "Success",
        description: "Episode published successfully!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to publish episode",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/episodes/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });

      if (currentEpisode?.id === id) {
        setCurrentEpisode(null);
        setIsPlaying(false);
        audioPlayer?.pause();
      }

      toast({
        title: "Success",
        description: "Episode deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete episode",
        variant: "destructive"
      });
    }
  };

  // Get view from MainLayout context
  const view = window.localStorage.getItem('view') as 'grid' | 'list' || 'list';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      </div>

      {currentEpisode && (
        <div className="mb-8">
          <PodcastPlayer
            episode={currentEpisode}
            onPlay={() => handlePlay(currentEpisode)}
            onPause={handlePause}
            onPublish={currentEpisode.status === 'draft' ? handlePublish : undefined}
            isPlaying={isPlaying}
            waveformData={waveformData}
          />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Episodes</h2>
        <EpisodeList 
          onPlay={handlePlay} 
          onDelete={handleDelete}
          view={view}
        />
      </div>
    </div>
  );
}