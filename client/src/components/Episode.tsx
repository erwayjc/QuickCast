import React, { useState } from 'react';
import { type transcriptionStatus } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Template {
  id: number;
  name: string;
  type: 'intro' | 'outro';
}

interface EpisodeProps {
  title: string;
  duration: string;
  date: string;
  isDraft?: boolean;
  transcriptionStatus?: (typeof transcriptionStatus.enumValues)[number];
  transcript?: string | null;
  showNotes?: string | null;
  aiGeneratedTags?: string[] | null;
  aiGeneratedSummary?: string | null;
  titleSuggestions?: string[] | null;
  templates?: Template[];
  isProcessing?: boolean;
  onPlay?: () => void;
  onTranscribe?: () => void;
  onDelete?: () => void;
  onProcess?: (introId?: number, outroId?: number) => void;
  onApplyTitleSuggestion?: (index: number) => void;
}

const Episode: React.FC<EpisodeProps> = ({
  title,
  duration,
  date,
  isDraft = false,
  transcriptionStatus = 'pending',
  transcript,
  showNotes,
  aiGeneratedTags,
  aiGeneratedSummary,
  titleSuggestions,
  templates = [],
  isProcessing = false,
  onPlay,
  onTranscribe,
  onDelete,
  onProcess,
  onApplyTitleSuggestion
}) => {
  const [selectedIntro, setSelectedIntro] = useState<string>();
  const [selectedOutro, setSelectedOutro] = useState<string>();

  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDraft && (
            <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded">
              Draft
            </span>
          )}
          {transcriptionStatus === 'processing' && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded animate-pulse">
              Transcribing...
            </span>
          )}
          {transcriptionStatus === 'completed' && (
            <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
              Transcribed
            </span>
          )}
          {isProcessing && (
            <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded animate-pulse">
              Processing Audio...
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5">⏱️</span>
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5">📅</span>
            {date}
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            onClick={onPlay}
            variant="secondary"
            size="sm"
          >
            <span className="mr-2">▶️</span>
            Play
          </Button>

          {transcriptionStatus !== 'completed' && (
            <Button
              onClick={onTranscribe}
              variant="secondary"
              size="sm"
              disabled={transcriptionStatus === 'processing'}
            >
              <span className="mr-2">📝</span>
              {transcriptionStatus === 'processing' ? 'Transcribing...' : 'Transcribe'}
            </Button>
          )}

          <Button
            onClick={onDelete}
            variant="destructive"
            size="sm"
          >
            <span className="mr-2">🗑️</span>
            Delete
          </Button>
          <Button
            onClick={() => {
              console.log('Creating test template...');
              fetch('/api/templates', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: "Test Intro",
                  type: "intro",
                  backgroundMusic: "/uploads/test-intro.mp3"
                })
              })
              .then(res => res.json())
              .then(data => {
                console.log('Template created:', data);
                // Now let's check all templates
                return fetch('/api/templates');
              })
              .then(res => res.json())
              .then(templates => {
                console.log('All templates:', templates);
              })
              .catch(err => {
                console.error('Error:', err);
              });
            }}
            variant="outline"
            size="sm"
          >
            <span className="mr-2">🧪</span>
            Test Templates
          </Button>
        </div>

        <div className="mt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="showNotes">Show Notes</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="titles">Titles</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {aiGeneratedSummary && (
                <div className="mt-2 text-sm text-gray-600">
                  <h4 className="font-semibold mb-1">Summary</h4>
                  <p>{aiGeneratedSummary}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transcript">
              {transcript && (
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="text-sm whitespace-pre-wrap">{transcript}</div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="showNotes">
              {showNotes && (
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="text-sm whitespace-pre-wrap">{showNotes}</div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="tags">
              {aiGeneratedTags && aiGeneratedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4">
                  {aiGeneratedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="titles">
              {titleSuggestions && titleSuggestions.length > 0 && (
                <div className="space-y-2 p-4">
                  {titleSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{suggestion}</span>
                      <Button
                        onClick={() => onApplyTitleSuggestion?.(index)}
                        variant="outline"
                        size="sm"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="process">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intro Template</label>
                  <Select
                    value={selectedIntro}
                    onValueChange={setSelectedIntro}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter(t => t.type === 'intro')
                        .map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Outro Template</label>
                  <Select
                    value={selectedOutro}
                    onValueChange={setSelectedOutro}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter(t => t.type === 'outro')
                        .map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => onProcess?.(
                    selectedIntro ? Number(selectedIntro) : undefined,
                    selectedOutro ? Number(selectedOutro) : undefined
                  )}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process Episode'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Episode;