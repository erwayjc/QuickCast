import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Clock, Calendar } from 'lucide-react';
import type { Episode } from '@shared/schema';
import { format } from 'date-fns';

interface EpisodeListProps {
  onPlay: (episode: Episode) => void;
  onDelete: (id: number) => void;
  view: 'grid' | 'list';
}

export function EpisodeList({ onPlay, onDelete, view }: EpisodeListProps) {
  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes']
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

  return (
    <div className={view === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
      : "space-y-4"
    }>
      {episodes.map((episode) => (
        <Card key={episode.id} className={view === 'grid' ? 'h-full' : ''}>
          <CardContent className={`flex ${view === 'grid' ? 'flex-col h-full' : 'items-center'} p-4 gap-4`}>
            <div className="flex-1">
              <h3 className="font-medium truncate">{episode.title}</h3>
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
              {view === 'grid' && (
                <div className="mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPlay(episode)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
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
              )}
            </div>

            {view === 'list' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPlay(episode)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => onDelete(episode.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}