import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type transcriptionStatus } from '@shared/schema';

interface PlayerProps {
  episode: {
    id: number;
    title: string;
    audioUrl: string;
    transcript?: string | null;
    transcriptionStatus?: (typeof transcriptionStatus.enumValues)[number];
  };
  onTranscribe?: (id: number) => void;
}

export function Player({ episode, onTranscribe }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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
    </>
  );
}

export default Player;