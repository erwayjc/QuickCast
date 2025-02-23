import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Clock, Calendar, ChevronDown, ChevronUp, Tag, CheckCircle2, FileText } from 'lucide-react';
import type { Episode } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface EpisodeListProps {
  onPlay: (episode: Episode) => void;
  onDelete: (id: number) => void;
  view: 'grid' | 'list';
}

export function EpisodeList({ onPlay, onDelete, view }: EpisodeListProps) {
  const { data: episodes, isLoading } = useQuery<Episode[]>({
    queryKey: ['/api/episodes']
  });
  const [expandedEpisodes, setExpandedEpisodes] = useState<number[]>([]);
  const [editingTranscript, setEditingTranscript] = useState<{id: number, text: string} | null>(null);
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

  const approveTranscript = useMutation({
    mutationFn: async ({ id, transcript }: { id: number; transcript: string }) => {
      const response = await apiRequest('PATCH', `/api/episodes/${id}/transcript`, { transcript });
      return response.json();
    },
    onSuccess: () => {
      setEditingTranscript(null);
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      toast({
        title: "Success",
        description: "Transcript saved successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save transcript",
        variant: "destructive"
      });
    }
  });

  const toggleExpanded = (id: number) => {
    setExpandedEpisodes(prev => 
      prev.includes(id) 
        ? prev.filter(epId => epId !== id)
        : [...prev, id]
    );
  };

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
          <Card key={episode.id} className={view === 'grid' ? 'h-full' : ''}>
            <CardContent className={`flex ${view === 'grid' ? 'flex-col h-full' : 'items-start'} p-4 gap-4`}>
              <div className="flex-1 w-full">
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

                {episode.status === 'draft' && !episode.transcript && !episode.transcriptionStatus && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => transcribeEpisode.mutate(episode.id)}
                      disabled={transcribeEpisode.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create episode transcript?
                    </Button>
                  </div>
                )}

                {episode.transcript && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Transcript</h4>
                    {editingTranscript?.id === episode.id ? (
                      <div className="space-y-2">
                        <Textarea 
                          value={editingTranscript.text}
                          onChange={(e) => setEditingTranscript({ id: episode.id, text: e.target.value })}
                          className="min-h-[200px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveTranscript.mutate({ 
                              id: episode.id, 
                              transcript: editingTranscript.text 
                            })}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTranscript(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {episode.transcript}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTranscript({ 
                              id: episode.id, 
                              text: episode.transcript || '' 
                            })}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {episode.titleSuggestions && episode.titleSuggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Title Suggestions</h4>
                    <div className="space-y-2">
                      {episode.titleSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start text-left"
                            onClick={() => updateTitle.mutate({ id: episode.id, title: suggestion })}
                          >
                            {suggestion}
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                {(episode.showNotes || episode.aiGeneratedTags) && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(episode.id)}
                      className="w-full justify-between"
                    >
                      Show AI Content
                      {expandedEpisodes.includes(episode.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedEpisodes.includes(episode.id) && (
                      <div className="mt-2 space-y-2">
                        {episode.showNotes && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Show Notes</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{episode.showNotes}</p>
                          </div>
                        )}
                        {episode.aiGeneratedTags && episode.aiGeneratedTags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {episode.aiGeneratedTags.map((tag, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
    </div>
  );

  return (
    <div>
      {draftEpisodes.length > 0 && renderEpisodeList(draftEpisodes, 'Drafts')}
      {publishedEpisodes.length > 0 && renderEpisodeList(publishedEpisodes, 'Published Episodes')}
    </div>
  );
}