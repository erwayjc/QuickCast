import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, SkipBack, Play, Pause, SkipForward, FileEdit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type transcriptionStatus } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PlayerProps {
  episode: {
    id: number;
    title: string;
    audioUrl: string;
    transcript?: string | null;
    showNotes?: string | null;
    transcriptionStatus?: (typeof transcriptionStatus.enumValues)[number];
  };
  onTranscribe?: (id: number) => void;
}

export function PodcastPlayer({ episode, onTranscribe }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateShowNotes = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/episodes/${episode.id}/show-notes`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate show notes');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      toast({
        title: "Show Notes Generated",
        description: "Your episode's show notes have been generated successfully.",
        duration: 5000,
      });
      setShowNotes(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Show Notes",
        description: error.message || "Please ensure the episode is transcribed first.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleTranscriptClick = () => {
    if (episode.transcriptionStatus === 'completed' && episode.transcript) {
      setShowTranscript(true);
    } else if (onTranscribe && episode.transcriptionStatus !== 'processing') {
      onTranscribe(episode.id);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex-grow">{episode.title}</h2>

            {/* Transcription Status Indicator */}
            {episode.transcriptionStatus === 'processing' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full animate-pulse">
                Transcribing...
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="ghost" size="icon">
              <SkipBack className="h-6 w-6" />
            </Button>

            <Button 
              variant="default" 
              size="icon" 
              className="h-12 w-12 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <Button variant="ghost" size="icon">
              <SkipForward className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleTranscriptClick}
              className={episode.transcriptionStatus === 'completed' ? 'text-green-600' : ''}
              disabled={episode.transcriptionStatus === 'processing'}
            >
              <FileText className="h-6 w-6" />
            </Button>

            {episode.transcriptionStatus === 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => generateShowNotes.mutate()}
                disabled={generateShowNotes.isPending}
                className={episode.showNotes ? 'text-green-600' : ''}
              >
                <FileEdit className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transcript - {episode.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-sm whitespace-pre-wrap">
            {episode.transcript}
          </div>
        </DialogContent>
      </Dialog>

      {/* Show Notes Dialog */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Show Notes - {episode.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 prose prose-sm max-w-none">
            {episode.showNotes ? (
              <div dangerouslySetInnerHTML={{ __html: episode.showNotes }} />
            ) : (
              <p className="text-muted-foreground">No show notes available yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PodcastPlayer;