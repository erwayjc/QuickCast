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
    // In a real app, we'd upload to cloud storage
    const audioUrl = URL.createObjectURL(blob);
    
    try {
      const episode = await apiRequest('POST', '/api/episodes', {
        title: `Episode ${new Date().toLocaleDateString()}`,
        audioUrl,
        duration: Math.floor(blob.size / 16000), // Rough estimate
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2D2D2D] mb-2">QuickCast</h1>
          <p className="text-gray-600">Record your podcast with one click</p>
        </div>

        <div className="mb-12">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#2D2D2D] mb-4">Episodes</h2>
          <EpisodeList onPlay={handlePlay} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
