import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlayCircle, PauseCircle, Plus, Save, Trash2 } from 'lucide-react';
import type { Template } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMusicGenerator, type MusicPattern } from '@/lib/musicGenerator';

const DEFAULT_PATTERNS: MusicPattern[] = [
  { name: 'Upbeat Intro', pattern: [1, 0, 1, 0, 1, 1, 0, 1], bpm: 120 },
  { name: 'Mellow Outro', pattern: [1, 0, 0, 1, 0, 0, 1, 0], bpm: 90 },
  { name: 'Professional', pattern: [1, 1, 0, 0, 1, 0, 1, 0], bpm: 100 },
];

export default function TemplatesPage() {
  const [selectedPattern, setSelectedPattern] = useState<MusicPattern>(DEFAULT_PATTERNS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const musicGenerator = useMusicGenerator();

  // Fetch templates
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates']
  });

  // Add template mutation
  const addTemplate = useMutation({
    mutationFn: async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/templates', template);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: 'Success',
        description: 'Template created successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    }
  });

  const togglePlay = () => {
    if (!musicGenerator) return;

    if (isPlaying) {
      musicGenerator.stop();
      setIsPlaying(false);
    } else {
      musicGenerator.playPattern(selectedPattern);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (!musicGenerator) return;
    setVolume(value[0]);
    musicGenerator.setVolume(value[0]);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Podcast Templates</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="intro">
        <TabsList className="mb-8">
          <TabsTrigger value="intro">Intro Templates</TabsTrigger>
          <TabsTrigger value="outro">Outro Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="intro">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Music Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Pattern</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {DEFAULT_PATTERNS.map((pattern) => (
                        <Button
                          key={pattern.name}
                          variant={selectedPattern.name === pattern.name ? "secondary" : "outline"}
                          onClick={() => setSelectedPattern(pattern)}
                          className="justify-start"
                        >
                          {pattern.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Volume</label>
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Script Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Template name"
                  />
                  <Textarea
                    placeholder="Enter your intro script here..."
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saved Templates */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Saved Intro Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.filter(t => t.type === 'intro').map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Duration: {Math.floor(template.duration / 60)}:{(template.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.script}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outro">
          {/* Similar structure as intro but for outros */}
        </TabsContent>
      </Tabs>
    </div>
  );
}