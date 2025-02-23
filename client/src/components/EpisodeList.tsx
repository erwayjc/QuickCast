import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import type { Episode } from '@shared/schema';
import { format } from 'date-fns';

interface EpisodeListProps {
  onPlay: (episode: Episode) => void;
  onDelete: (id: number) => void;
}

export function EpisodeList({ onPlay, onDelete }: EpisodeListProps) {
  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes']
  });

  if (isLoading) {
    return <div>Loading episodes...</div>;
  }

  return (
    <div className="space-y-4">
      {episodes?.map((episode) => (
        <Card key={episode.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h3 className="font-medium">{episode.title}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(episode.createdAt), 'MMM d, yyyy')} • 
                {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
              </p>
            </div>
            
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
