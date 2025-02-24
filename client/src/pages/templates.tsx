import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { FileMusic, Trash2, Play, Download } from "lucide-react";

interface AudioFile {
  id: string;
  name: string;
  file: File;
  type: 'intro' | 'outro';
}

export default function Templates() {
  const [activeTab, setActiveTab] = useState<'intro' | 'outro'>('intro');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<'intro' | 'outro', AudioFile[]>>({ intro: [], outro: [] });
  const [fileName, setFileName] = useState('');

  const { toast } = useToast();
  const { playAudio } = useAudioPlayer();

  useEffect(() => {
    loadAudioFiles();
  }, []);

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
        type: activeTab
      };

      setUploadedFiles(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newAudioFile]
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Audio Templates</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'intro' | 'outro')}>
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

        {uploadedFiles[activeTab].length === 0 ? (
          <p className="text-muted-foreground">No audio files saved yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles[activeTab].map(file => (
              <Card key={file.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{file.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file.id, activeTab)}
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
    </div>
  );
}