import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveCustomPrompt, getCustomPrompt } from '@/services/promptService';

interface PromptEditorProps {
  sectionId: string;
  sectionName: string;
  defaultPrompt: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ 
  sectionId, 
  sectionName, 
  defaultPrompt 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState<string>('');
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const { toast } = useToast();

  // Load saved prompt when component mounts or section changes
  useEffect(() => {
    const loadSavedPrompt = async () => {
      try {
        const savedPrompt = await getCustomPrompt(sectionId);
        if (savedPrompt) {
          setPromptText(savedPrompt);
        } else {
          setPromptText(defaultPrompt);
        }
        setIsEdited(false);
      } catch (error) {
        console.error('Error loading prompt:', error);
        setPromptText(defaultPrompt);
      }
    };

    loadSavedPrompt();
  }, [sectionId, defaultPrompt]);

  // Handle saving the custom prompt
  const handleSavePrompt = async () => {
    try {
      await saveCustomPrompt(sectionId, promptText);
      toast({
        title: 'Prompt saved',
        description: `Custom prompt for ${sectionName} has been saved.`,
      });
      setIsEdited(false);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error saving prompt',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Handle resetting to default prompt
  const handleResetToDefault = () => {
    setPromptText(defaultPrompt);
    setIsEdited(true);
  };

  // Handle prompt text change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
    setIsEdited(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 hover:bg-accent"
          title={`Customize AI prompt for ${sectionName}`}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Customize Prompt</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customize AI Prompt for {sectionName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-start space-x-2 mb-4">
            <Info className="h-4 w-4 text-blue-500 mt-1" />
            <p className="text-sm text-muted-foreground">
              Customize how AI generates content for this section. The prompt will be sent to ChatGPT/OpenAI when generating content.
            </p>
          </div>

          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <Textarea
              value={promptText}
              onChange={handlePromptChange}
              placeholder="Enter custom AI prompt..."
              className="min-h-[200px]"
            />
          </ScrollArea>

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Prompt Variables:</h4>
            <p className="text-sm text-muted-foreground mb-1">
              Use these variables in your prompt:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{'{title}'} - Episode title</li>
              <li>{'{transcript}'} - Episode transcript</li>
              <li>{'{duration}'} - Episode duration</li>
              <li>{'{date}'} - Recording date</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSavePrompt} disabled={!isEdited}>
            Save Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditor;