import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from "lucide-react";
import PromptEditor from './PromptEditor';
import { getDefaultPrompt } from '@/services/promptService';

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

interface EpisodeDraftProps {
  episode: Episode;
  onUpdate: (section: keyof Episode, value: string) => void;
  onGenerate: (section: keyof Episode) => void;
  isGenerating: GeneratingState;
}

const EpisodeDraft: React.FC<EpisodeDraftProps> = ({ 
  episode, 
  onUpdate, 
  onGenerate, 
  isGenerating 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Map section to display name
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

  const sections: (keyof Episode)[] = ['overview', 'transcript', 'showNotes', 'tags', 'titles', 'process'];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-6">
        {sections.map(section => (
          <TabsTrigger key={section} value={section}>
            {sectionToTitle(section)}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map(section => (
        <TabsContent key={section} value={section}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{sectionToTitle(section)}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGenerate(section)}
                    disabled={isGenerating[section as keyof GeneratingState]}
                  >
                    {isGenerating[section as keyof GeneratingState] ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  <PromptEditor 
                    sectionId={section} 
                    sectionName={sectionToTitle(section)} 
                    defaultPrompt={getDefaultPrompt(section)} 
                  />
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <Textarea
                  value={episode[section] || ''}
                  onChange={(e) => onUpdate(section, e.target.value)}
                  placeholder={`Enter ${sectionToTitle(section).toLowerCase()}...`}
                  className="min-h-full"
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default EpisodeDraft;