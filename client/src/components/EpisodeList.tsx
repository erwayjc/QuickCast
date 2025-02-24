import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Episode as EpisodeType } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Episode from './Episode';

interface EpisodeListProps {
  onPlay: (episode: EpisodeType) => void;
  onDelete: (id: number) => void;
  view: 'grid' | 'list';
}

export function EpisodeList({ onPlay, onDelete, view }: EpisodeListProps) {
  const { data: episodes, isLoading } = useQuery<EpisodeType[]>({
    queryKey: ['/api/episodes']
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transcribeEpisode = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/episodes/${id}/transcribe`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transcribe episode');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      toast({
        title: "Transcription Started",
        description: "Your episode is being transcribed. This may take a few minutes.",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transcription Failed",
        description: error.message || "Unable to start transcription. Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Loading episodes...</p>
      </div>
    );
  }

  if (!episodes?.length) {
    return (
      <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No episodes recorded yet</p>
      </div>
    );
  }

  const draftEpisodes = episodes.filter(episode => episode.status === 'draft');
  const publishedEpisodes = episodes.filter(episode => episode.status === 'published');

  const renderEpisodeList = (episodeList: EpisodeType[], title: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className={view === 'grid'
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "space-y-4"
      }>
        {episodeList.map((episode) => (
          <Episode
            key={episode.id}
            title={episode.title}
            duration={`${Math.floor(episode.duration / 60)}:${(episode.duration % 60).toString().padStart(2, '0')}`}
            date={format(new Date(episode.createdAt), 'MMM d, yyyy')}
            isDraft={episode.status === 'draft'}
            transcriptionStatus={episode.transcriptionStatus || 'pending'}
            onPlay={() => onPlay(episode)}
            onTranscribe={() => transcribeEpisode.mutate(episode.id)}
            onDelete={() => onDelete(episode.id)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {draftEpisodes.length > 0 && renderEpisodeList(draftEpisodes, 'Drafts')}
      {publishedEpisodes.length > 0 && renderEpisodeList(publishedEpisodes, 'Published Episodes')}
    </div>
  );
}

export default EpisodeList;