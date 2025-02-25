import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Text,
  Textarea,
  Button,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Badge,
  Divider
} from '@chakra-ui/react';
import { 
  getDefaultPrompt, 
  getCustomPrompt, 
  saveCustomPrompt, 
  getAllCustomPrompts
} from '@/services/promptService';

interface PromptSection {
  id: string;
  name: string;
  defaultPrompt: string;
  customPrompt: string;
  isEdited: boolean;
}

const PromptTemplates: React.FC = () => {
  const [promptSections, setPromptSections] = useState<PromptSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  // Define all the sections that need prompts
  const sectionDefinitions = [
    { id: 'overview', name: 'Episode Overview' },
    { id: 'transcript', name: 'Transcript Cleanup' },
    { id: 'show-notes', name: 'Show Notes' },
    { id: 'tags', name: 'Tags & Keywords' },
    { id: 'titles', name: 'Alternative Titles' },
    { id: 'process', name: 'Process Steps' }
  ];

  // Load all prompts (default and custom)
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoading(true);

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
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, [toast]);

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
        title: 'Prompt saved',
        description: `${section.name} prompt has been saved`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving prompt',
        description: 'Could not save the prompt template',
        status: 'error',
        duration: 3000,
        isClosable: true,
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
      title: 'Prompt reset',
      description: `${section.name} prompt has been reset to default`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle saving all prompts
  const handleSaveAllPrompts = async () => {
    try {
      // Get only the edited sections
      const editedSections = promptSections.filter(section => section.isEdited);
      if (editedSections.length === 0) {
        toast({
          title: 'No changes to save',
          status: 'info',
          duration: 2000,
          isClosable: true,
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
        title: 'All prompts saved',
        description: `${editedSections.length} prompt templates have been saved`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving prompts',
        description: 'Some prompts could not be saved',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>AI Prompt Templates</Heading>
      <Text mb={6}>
        Customize the prompts used to generate content with AI for each section of your podcast episodes.
      </Text>

      {/* Save All button */}
      <Flex justifyContent="flex-end" mb={4}>
        <Button 
          colorScheme="red" 
          onClick={handleSaveAllPrompts}
          isDisabled={!promptSections.some(section => section.isEdited)}
          isLoading={isLoading}
        >
          Save All Changes
        </Button>
      </Flex>

      {/* Prompt sections in accordion */}
      <Accordion allowMultiple defaultIndex={[0]}>
        {promptSections.map((section) => (
          <AccordionItem key={section.id} mb={4}>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold">
                {section.name}
              </Box>
              {section.isEdited && (
                <Badge colorScheme="red" mr={2}>Edited</Badge>
              )}
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  This prompt is used when generating {section.name.toLowerCase()} content with AI.
                </Text>

                <Textarea
                  value={section.customPrompt}
                  onChange={(e) => handlePromptChange(section.id, e.target.value)}
                  minHeight="200px"
                  fontSize="sm"
                />

                <Text fontSize="xs" color="gray.500">
                  Available variables: {'{title}'}, {'{transcript}'}, {'{duration}'}, {'{date}'}
                </Text>

                <Flex justifyContent="flex-end" gap={3}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleResetPrompt(section.id)}
                  >
                    Reset to Default
                  </Button>
                  <Button 
                    colorScheme="red" 
                    size="sm"
                    onClick={() => handleSavePrompt(section.id)}
                    isDisabled={!section.isEdited}
                  >
                    Save
                  </Button>
                </Flex>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      {isLoading && (
        <Box textAlign="center" py={10}>
          <Text>Loading prompt templates...</Text>
        </Box>
      )}
    </Box>
  );
};

export default PromptTemplates;