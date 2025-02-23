import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Clock, Calendar, FileText } from 'lucide-react';
import type { Episode } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EpisodeListProps {
  onPlay: (episode: Episode) => void;
  onDelete: (id: number) => void;
  view: 'grid' | 'list';
}

export function EpisodeList({ onPlay, onDelete, view }: EpisodeListProps) {
  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes']
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transcribeEpisode = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/episodes/${id}/transcribe`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      toast({
        title: "Success",
        description: "Started transcription process"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start transcription",
        variant: "destructive"
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

  const renderEpisodeList = (episodeList: Episode[], title: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className={view === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-4"
      }>
        {episodeList.map((episode) => (
          <Card key={episode.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{episode.title}</h3>
                {episode.status === 'draft' && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Draft
                  </span>
                )}
                {episode.transcriptionStatus === 'processing' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
                    Processing Transcript
                  </span>
                )}
              </div>

              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(episode.createdAt), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPlay(episode)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
                {episode.status === 'draft' && !episode.transcriptionStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => transcribeEpisode.mutate(episode.id)}
                    disabled={transcribeEpisode.isPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create episode transcript?
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => onDelete(episode.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
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