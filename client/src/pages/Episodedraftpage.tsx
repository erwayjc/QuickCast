import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
import { useAudio } from '@/App';
import EpisodeDraft from '@/components/EpisodeDraft';
import { generateAIContent } from '@/services/aiservice';

interface EpisodeDraftPageProps {
  id?: string;
}

interface Episode {
  id: string;
  title: string;
  duration: string;
  recordedAt: string;
  status: string;
  overview: string;
  transcript: string;
  showNotes: string;
  tags: string;
  titles: string;
  process: string;
}

interface GeneratingState {
  overview: boolean;
  transcript: boolean;
  showNotes: boolean;
  tags: boolean;
  titles: boolean;
  process: boolean;
}

const EpisodeDraftPage: React.FC<EpisodeDraftPageProps> = ({ id = 'new' }) => {
  const { isTranscribing, transcribe } = useAudio();
  const toast = useToast();

  // State for the episode data
  const [episode, setEpisode] = useState<Episode>({
    id: id || 'new',
    title: 'From Idea to Reality: Creating Your Brand New App',
    duration: '0:29',
    recordedAt: '2025-02-23',
    status: 'draft',
    overview: 'In the latest podcast episode, the host discusses the process of creating a new app. Key topics include the initial stages of app design, the importance of understanding user needs, and strategies for effective development. The host highlights the significance of thorough market research to identify gaps and opportunities within the app industry. They also emphasize the necessity of a clear vision and objectives to guide the app\'s development process. Additionally, collaboration with a skilled tech team and utilizing feedback for continuous improvement are highlighted as crucial steps in creating a successful app. The episode provides valuable insights and practical advice for aspiring app developers looking to enter the industry.',
    transcript: '',
    showNotes: '',
    tags: '',
    titles: '',
    process: ''
  });

  // State for generating status
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({
    overview: false,
    transcript: false,
    showNotes: false,
    tags: false,
    titles: false,
    process: false
  });

  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load episode data
  useEffect(() => {
    const loadEpisode = async () => {
      if (id === 'new') return;

      try {
        setIsLoading(true);
        // Here you would fetch the episode data from your API
        // For now, we'll just use the default data
        // Example: const response = await fetch(`/api/episodes/${id}`);
        // const data = await response.json();
        // setEpisode(data);
      } catch (error) {
        toast({
          title: 'Error loading episode',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisode();
  }, [id, toast]);

  // Handle updating episode content
  const handleContentUpdate = (section: keyof Episode, value: string) => {
    setEpisode(prev => ({
      ...prev,
      [section]: value
    }));

    // Here you would save the change to your API
    // Example: 
    // fetch(`/api/episodes/${id}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ [section]: value })
    // });

    toast({
      title: 'Content updated',
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  // Handle generating content with AI
  const handleGenerateContent = async (section: keyof Episode) => {
    try {
      // Update generating state
      setIsGenerating(prev => ({
        ...prev,
        [section]: true
      }));

      // Get the section ID for prompt lookup
      const sectionId = getSectionId(section as string);

      // Generate content
      const content = await generateAIContent(sectionId, episode);

      // Update episode state
      setEpisode(prev => ({
        ...prev,
        [section]: content
      }));

      // Here you would save the change to your API
      // Example:
      // fetch(`/api/episodes/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [section]: content })
      // });

      toast({
        title: 'Content generated',
        description: `${getSectionName(section as string)} has been generated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error generating content',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Reset generating state
      setIsGenerating(prev => ({
        ...prev,
        [section]: false
      }));
    }
  };

  // Helper function to map section to ID
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

  // Helper function to get section display name
  const getSectionName = (section: string): string => {
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

  // Handle play button click
  const handlePlayClick = () => {
    toast({
      title: 'Playing episode',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    // Here you would implement play functionality
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    // Here you would implement delete functionality
    toast({
      title: 'Episode deleted',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    // Navigate to home or episodes list
  };

  if (isLoading) {
    return (
      <div style={{textAlign: "center", paddingTop: "10rem"}}>
        <Spinner />
        <p style={{marginTop: "1rem"}}>Loading episode...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "5rem", paddingBottom: "5rem"}}>
      <div>
        {/* Episode header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem"}}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold"}}>{episode.title}</h1>
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center"}}>
              <span style={{ color: "gray", marginRight: "0.5rem"}}>{episode.duration}</span>
              <span style={{ color: "gray", marginRight: "0.5rem"}}>•</span>
              <span style={{ color: "gray"}}>{new Date(episode.recordedAt).toLocaleDateString()}</span>
              <Badge variant="outline">
                {episode.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem"}}>
            <Button onClick={handlePlayClick} variant="default">
              <Play className="h-4 w-4 mr-2" /> Play
            </Button>
            <Button onClick={handleDeleteClick} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        {/* Episode content with tabs */}
        <div style={{marginTop: "2rem"}}>
          <EpisodeDraft
            episode={episode}
            onUpdate={handleContentUpdate}
            onGenerate={handleGenerateContent}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default EpisodeDraftPage;