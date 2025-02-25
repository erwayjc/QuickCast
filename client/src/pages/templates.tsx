import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { FileMusic, Trash2, Play, Download, Settings, Save, Undo } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import PodcastInfo from '@/components/PodcastInfo';
import { 
  getDefaultPrompt, 
  getCustomPrompt, 
  saveCustomPrompt, 
  getAllCustomPrompts
} from '@/services/promptService';
import { getPodcastInfo } from '@/services/podcastInfoService';

interface AudioFile {
  id: string;
  name: string;
  file: File;
  type: 'intro' | 'outro';
}

interface PromptSection {
  id: string;
  name: string;
  defaultPrompt: string;
  customPrompt: string;
  isEdited: boolean;
}

export default function Templates() {
  // Audio Templates state
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<'intro' | 'outro', AudioFile[]>>({ intro: [], outro: [] });
  const [fileName, setFileName] = useState('');

  // AI Prompts state
  const [promptSections, setPromptSections] = useState<PromptSection[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(true);

  // Podcast info state
  const [podcastInfo, setPodcastInfo] = useState({
    hostName: '',
    targetAudience: ''
  });

  const { toast } = useToast();
  const { playAudio } = useAudioPlayer();

  useEffect(() => {
    loadAudioFiles();
    loadPrompts();
    loadPodcastInfo();
  }, []);

  // Define all the sections that need prompts
  const sectionDefinitions = [
    { id: 'overview', name: 'Episode Overview' },
    { id: 'transcript', name: 'Transcript Cleanup' },
    { id: 'show-notes', name: 'Show Notes' },
    { id: 'tags', name: 'Tags & Keywords' },
    { id: 'titles', name: 'Alternative Titles' },
    { id: 'process', name: 'Process Steps' }
  ];

  // Load podcast info
  const loadPodcastInfo = async () => {
    try {
      const info = await getPodcastInfo();
      if (info) {
        setPodcastInfo(info);
      }
    } catch (error) {
      console.error('Error loading podcast info:', error);
      toast({
        title: 'Error',
        description: 'Could not load podcast information',
        variant: 'destructive',
      });
    }
  };

  // Load all prompts (default and custom)
  const loadPrompts = async () => {
    try {
      setIsLoadingPrompts(true);

      const sectionsWithPrompts = await Promise.all(
        sectionDefinitions.map(async (section) => {
          const defaultPrompt = getDefaultPrompt(section.id);
          const customPrompt = await getCustomPrompt(section.id);

          return {
            id: section.id,
            name: section.name,
            defaultPrompt,
            customPrompt: customPrompt || defaultPrompt,
            isEdited: false
          };
        })
      );

      setPromptSections(sectionsWithPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: 'Error loading prompts',
        description: 'Could not load prompt templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleSaveAudioFile = async () => {
    if (!audioFile || !fileName) {
      toast({
        title: "Required fields missing",
        description: "Please provide both an audio file and a name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newAudioFile: AudioFile = {
        id: Date.now().toString(),
        name: fileName,
        file: audioFile,
        type: activeTab as 'intro' | 'outro'
      };

      setUploadedFiles(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab as 'intro' | 'outro'], newAudioFile]
      }));

      toast({
        title: "Success",
        description: "Audio file saved successfully",
      });

      // Reset form
      setFileName('');
      setAudioFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save audio file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (id: string, type: 'intro' | 'outro') => {
    try {
      setUploadedFiles(prev => ({
        ...prev,
        [type]: prev[type].filter(file => file.id !== id)
      }));

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file",
          variant: "destructive",
        });
        return;
      }

      setAudioFile(file);
      // Set a default name from the file name (without extension)
      setFileName(file.name.split('.').slice(0, -1).join('.'));
      toast({
        title: "File selected",
        description: file.name,
      });
    }
  };

  // Placeholder function to be implemented with actual API calls
  const loadAudioFiles = async () => {
    // Implementation pending
  };

  // Handle prompt text change
  const handlePromptChange = (sectionId: string, newValue: string) => {
    setPromptSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { ...section, customPrompt: newValue, isEdited: true } 
          : section
      )
    );
  };

  // Handle saving a prompt
  const handleSavePrompt = async (sectionId: string) => {
    try {
      const section = promptSections.find(s => s.id === sectionId);
      if (!section) return;

      await saveCustomPrompt(sectionId, section.customPrompt);

      // Update the section to show it's no longer edited (saved)
      setPromptSections(prevSections => 
        prevSections.map(s => 
          s.id === sectionId ? { ...s, isEdited: false } : s
        )
      );

      toast({
        title: "Success",
        description: `${section.name} prompt has been saved`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save the prompt template",
        variant: "destructive",
      });
    }
  };

  // Handle resetting a prompt to default
  const handleResetPrompt = (sectionId: string) => {
    const section = promptSections.find(s => s.id === sectionId);
    if (!section) return;

    setPromptSections(prevSections => 
      prevSections.map(s => 
        s.id === sectionId 
          ? { ...s, customPrompt: s.defaultPrompt, isEdited: true } 
          : s
      )
    );

    toast({
      title: "Reset successful",
      description: `${section.name} prompt has been reset to default`,
    });
  };

  // Handle saving all prompts
  const handleSaveAllPrompts = async () => {
    try {
      // Get only the edited sections
      const editedSections = promptSections.filter(section => section.isEdited);
      if (editedSections.length === 0) {
        toast({
          title: "No changes to save",
          description: "No prompts have been modified",
        });
        return;
      }

      // Save all edited prompts
      await Promise.all(
        editedSections.map(section => 
          saveCustomPrompt(section.id, section.customPrompt)
        )
      );

      // Mark all as saved (not edited)
      setPromptSections(prevSections => 
        prevSections.map(section => ({ ...section, isEdited: false }))
      );

      toast({
        title: "Success",
        description: `${editedSections.length} prompt templates have been saved`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Some prompts could not be saved",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Podcast Templates</h1>

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audio">Audio Templates</TabsTrigger>
          <TabsTrigger value="podcast-info">Podcast Info</TabsTrigger>
          <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
        </TabsList>

        {/* Audio Templates Tab Content */}
        <TabsContent value="audio" className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="intro">Intro Audio</TabsTrigger>
              <TabsTrigger value="outro">Outro Audio</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Audio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="mb-4"
                  />
                  {audioFile && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileMusic className="h-4 w-4" />
                        <span className="flex-1 truncate">{audioFile.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAudioFile(null);
                            setFileName('');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Enter a name for this audio"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                      <Button 
                        className="w-full"
                        onClick={handleSaveAudioFile}
                      >
                        Save Audio Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Tabs>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              Saved {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Audio Files
            </h2>

            {uploadedFiles[activeTab as 'intro' | 'outro'].length === 0 ? (
              <p className="text-muted-foreground">No audio files saved yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles[activeTab as 'intro' | 'outro'].map(file => (
                  <Card key={file.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{file.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFile(file.id, file.type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const url = URL.createObjectURL(file.file);
                            playAudio(url);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const url = URL.createObjectURL(file.file);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.file.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Podcast Info Tab Content */}
        <TabsContent value="podcast-info" className="space-y-6">
          <PodcastInfo 
            initialData={podcastInfo}
            onSaveSuccess={loadPrompts} // Reload prompts when info is saved
          />

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Available Variables</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Variable</h4>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{host}"}</p>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{audience}"}</p>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{title}"}</p>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{transcript}"}</p>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{duration}"}</p>
                      <p className="p-2 bg-gray-50 rounded-md font-mono text-sm">{"{date}"}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Description</h4>
                      <p className="p-2 rounded-md">The podcast host's name</p>
                      <p className="p-2 rounded-md">The target audience</p>
                      <p className="p-2 rounded-md">Episode title</p>
                      <p className="p-2 rounded-md">Episode transcript</p>
                      <p className="p-2 rounded-md">Episode duration</p>
                      <p className="p-2 rounded-md">Recording date</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Prompts Tab Content */}
        <TabsContent value="ai-prompts" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">AI Prompt Templates</h2>
            <Button 
              onClick={handleSaveAllPrompts}
              disabled={!promptSections.some(section => section.isEdited)}
            >
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          </div>

          <p className="text-muted-foreground mb-6">
            Customize the prompts used by ChatGPT to generate content for each section of your podcast episodes.
          </p>

          {isLoadingPrompts ? (
            <p className="text-center py-8 text-muted-foreground">Loading prompt templates...</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {promptSections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <span>{section.name}</span>
                      {section.isEdited && (
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-500 border-red-200">
                          Edited
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card className="border-0 shadow-none">
                      <CardContent className="pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          This prompt is used when generating {section.name.toLowerCase()} content with AI.
                        </p>

                        <textarea
                          value={section.customPrompt}
                          onChange={(e) => handlePromptChange(section.id, e.target.value)}
                          className="min-h-[200px] font-mono text-sm w-full p-2 border rounded-md resize-y"
                        />

                        <p className="text-xs text-muted-foreground mt-2">
                          Available variables: <code className="text-xs">{"{host}"}</code>, <code className="text-xs">{"{audience}"}</code>, <code className="text-xs">{"{title}"}</code>, <code className="text-xs">{"{transcript}"}</code>, <code className="text-xs">{"{duration}"}</code>, <code className="text-xs">{"{date}"}</code>
                        </p>

                        <div className="flex justify-end space-x-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResetPrompt(section.id)}
                          >
                            <Undo className="mr-2 h-3 w-3" />
                            Reset to Default
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleSavePrompt(section.id)}
                            disabled={!section.isEdited}
                          >
                            <Save className="mr-2 h-3 w-3" />
                            Save
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}