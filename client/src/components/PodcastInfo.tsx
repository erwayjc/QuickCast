import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Save, Settings, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PodcastInfoProps {
  initialData?: {
    hostName: string;
    targetAudience: string;
  };
  onSaveSuccess?: () => void;
}

interface PodcastInfoState {
  hostName: string;
  targetAudience: string;
}

const PodcastInfo: React.FC<PodcastInfoProps> = ({ 
  initialData = { hostName: '', targetAudience: '' },
  onSaveSuccess
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PodcastInfoState>(initialData);
  const { toast } = useToast();

  useEffect(() => {
    // Update form data if initialData changes
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Make a POST request to save the podcast info
      const response = await fetch('/api/podcast-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not save podcast information');
      }

      // If successful, exit edit mode
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Podcast information saved successfully",
      });

      // Call the success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error('Error saving podcast info:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not save podcast information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Podcast Information</h2>
          {!isEditing ? (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Info
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          This information will be used in AI-generated content to personalize your podcast.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Host Name</label>
            </div>
            {isEditing ? (
              <Input 
                name="hostName"
                value={formData.hostName}
                onChange={handleInputChange}
                placeholder="Enter the name of the podcast host"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-md">
                {formData.hostName || "No host name specified"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Used in prompts like: "In this episode, {'{host}'} discusses..."
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Target Audience</label>
            </div>
            {isEditing ? (
              <Input 
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                placeholder="Describe your target audience (e.g., business professionals, tech enthusiasts)"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-md">
                {formData.targetAudience || "No target audience specified"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Used to tailor content for your specific audience
            </p>
          </div>
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-between border-t pt-6">
          <Button 
            variant="ghost" 
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PodcastInfo;