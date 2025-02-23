import React, { useState } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EpisodeList } from '@/components/EpisodeList';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Episode } from '@shared/schema';

export default function Home() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRecordingComplete = async (blob: Blob) => {
    const audioUrl = URL.createObjectURL(blob);

    try {
      const episode = await apiRequest('POST', '/api/episodes', {
        title: `Episode ${new Date().toLocaleDateString()}`,
        audioUrl,
        duration: Math.floor(blob.size / 16000),
        hasIntro: false,
        hasOutro: false
      });

      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });

      toast({
        title: "Success",
        description: "Episode recorded successfully!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save episode",
        variant: "destructive"
      });
    }
  };

  const handlePlay = (episode: Episode) => {
    if (audioPlayer) {
      audioPlayer.pause();
    }

    const player = new Audio(episode.audioUrl);
    player.play();
    setAudioPlayer(player);
    setCurrentEpisode(episode);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/episodes/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });

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