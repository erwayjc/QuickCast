import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward, Upload, FileText } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import type { Episode } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PodcastPlayerProps {
  episode: Episode | null;
  onPlay: () => void;
  onPause: () => void;
  onPublish?: () => void;
  isPlaying: boolean;
  waveformData: Uint8Array;
}

export function PodcastPlayer({ 
  episode, 
  onPlay, 
  onPause, 
  onPublish,
  isPlaying, 
  waveformData 
}: PodcastPlayerProps) {
  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Podcast Thumbnail */}
          <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0">
            <img 
              src={episode?.artworkUrl || "https://picsum.photos/96/96"} 
              alt="Episode thumbnail" 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Player Content */}
          <div className="flex-1">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {episode?.title || 'No episode selected'}
                </h2>
                {episode?.transcriptionStatus === 'processing' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
                    Processing Transcript
                  </span>
                )}
              </div>
              {episode?.aiGeneratedSummary && (
                <p className="text-sm text-gray-500 line-clamp-2">{episode.aiGeneratedSummary}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="icon" disabled={!episode}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                className="h-12 w-12 rounded-full"
                disabled={!episode}
                onClick={isPlaying ? onPause : onPlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              <Button variant="outline" size="icon" disabled={!episode}>
                <SkipForward className="h-4 w-4" />
              </Button>

              <TooltipProvider>
                {episode?.transcript && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="ml-2">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Transcript</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>

              {episode?.status === 'draft' && onPublish && (
                <Button 
                  variant="outline"
                  onClick={onPublish}
                  className="ml-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
            </div>

            {/* Waveform */}
            <div className="w-full">
              <AudioWaveform analyserData={waveformData} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}