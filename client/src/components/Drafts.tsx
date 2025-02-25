import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Play, RefreshCw, Trash2 } from "lucide-react";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { getDraftEpisode, updateDraftEpisode, generateAIContent } from '../services/episodeService';
import PromptEditor from './PromptEditor';
import { getDefaultPrompt, getCustomPrompt } from '../services/promptService';

interface Episode {
  id: string;
  title: string;
  duration?: string;
  recordedAt?: string;
  status: 'draft' | 'published';
  overview?: string;
  transcript?: string;
  showNotes?: string;
  tags?: string;
  titles?: string;
  process?: string;
}

interface GeneratingState {
  overview: boolean;
  transcript: boolean;
  showNotes: boolean;
  tags: boolean;
  titles: boolean;
  process: boolean;
}

interface DraftsProps {
  id: string;
}

const Drafts: React.FC<DraftsProps> = ({ id }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    overview: false,
    transcript: false,
    showNotes: false,
    tags: false,
    titles: false,
    process: false
  });

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        setLoading(true);
        const data = await getDraftEpisode(id);
        setEpisode(data);
      } catch (error) {
        toast({
          title: 'Error loading episode',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEpisode();
    }
  }, [id, toast]);

  const handleContentUpdate = async (section: keyof Episode, value: string) => {
    if (!episode) return;

    try {
      const updatedEpisode = {
        ...episode,
        [section]: value
      };

      setEpisode(updatedEpisode);
      await updateDraftEpisode(id, { [section]: value });
    } catch (error) {
      toast({
        title: 'Error saving changes',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateContent = async (section: keyof Episode) => {
    if (!episode) return;

    try {
      setIsGenerating(prev => ({
        ...prev,
        [section]: true
      }));

      const sectionId = getSectionId(section);
      const customPrompt = await getCustomPrompt(sectionId);
      const defaultPrompt = getDefaultPrompt(sectionId);
      const promptToUse = customPrompt || defaultPrompt;

      const generatedContent = await generateAIContent(promptToUse);

      const updatedEpisode = {
        ...episode,
        [section]: generatedContent
      };

      setEpisode(updatedEpisode);
      await updateDraftEpisode(id, { [section]: generatedContent });

      toast({
        title: 'Content generated',
        description: `${sectionToTitle(section)} has been generated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error generating content',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(prev => ({
        ...prev,
        [section]: false
      }));
    }
  };

  const sectionToTitle = (section: string): string => {
    const mapping: Record<string, string> = {
      overview: 'Overview',
      transcript: 'Transcript',
      showNotes: 'Show Notes',
      tags: 'Tags',
      titles: 'Titles',
      process: 'Process'
    };
    return mapping[section] || section;
  };

  const getSectionId = (section: string): string => {
    const mapping: Record<string, string> = {
      overview: 'overview',
      transcript: 'transcript',
      showNotes: 'show-notes',
      tags: 'tags',
      titles: 'titles',
      process: 'process'
    };
    return mapping[section] || section;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
        <p className="ml-2">Loading episode...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Episode not found</p>
        <Button className="mt-4" onClick={() => navigate('/episodes')}>
          Back to Episodes
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{episode.title || 'Untitled Episode'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">{episode.duration || '0:00'}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">
                  {episode.recordedAt 
                    ? new Date(episode.recordedAt).toLocaleDateString() 
                    : 'Draft'}
                </span>
                <Badge variant="outline">
                  {episode.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/preview/${episode.id}`)}>
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="showNotes">Show Notes</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="titles">Titles</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>

            {(['overview', 'transcript', 'showNotes', 'tags', 'titles', 'process'] as const).map((section) => (
              <TabsContent key={section} value={section}>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">{sectionToTitle(section)}</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateContent(section)}
                      disabled={isGenerating[section]}
                    >
                      {isGenerating[section] ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <PromptEditor 
                      sectionId={getSectionId(section)} 
                      sectionName={sectionToTitle(section)} 
                      defaultPrompt={getDefaultPrompt(getSectionId(section))} 
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  <Textarea
                    value={episode[section] || ''}
                    onChange={(e) => handleContentUpdate(section, e.target.value)}
                    placeholder={`Enter ${sectionToTitle(section).toLowerCase()}...`}
                    className="min-h-full"
                  />
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Drafts;