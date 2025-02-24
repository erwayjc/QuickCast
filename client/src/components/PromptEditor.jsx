import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Textarea,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  VStack,
  HStack,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { SettingsIcon, InfoIcon } from '@chakra-ui/icons';
import { saveCustomPrompt, getCustomPrompt } from '../services/promptService';

// Component for editing and customizing AI prompts for different sections
const PromptEditor = ({ sectionId, sectionName, defaultPrompt }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [promptText, setPromptText] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const toast = useToast();

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
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEdited(false);
      onClose();
    } catch (error) {
      toast({
        title: 'Error saving prompt',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle resetting to default prompt
  const handleResetToDefault = () => {
    setPromptText(defaultPrompt);
    setIsEdited(true);
  };

  // Handle prompt text change
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
    setIsEdited(true);
  };

  return (
    <>
      <Tooltip label={`Customize AI prompt for ${sectionName}`}>
        <IconButton
          icon={<SettingsIcon />}
          aria-label={`Customize AI prompt for ${sectionName}`}
          size="sm"
          onClick={onOpen}
        />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Customize AI Prompt for {sectionName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack mb={2}>
                  <InfoIcon color="blue.500" />
                  <Text fontSize="sm" color="gray.600">
                    Customize how AI generates content for this section. The prompt will be sent to ChatGPT/OpenAI when generating content.
                  </Text>
                </HStack>
              </Box>

              <Textarea
                value={promptText}
                onChange={handlePromptChange}
                placeholder="Enter custom AI prompt..."
                size="md"
                minHeight="200px"
              />

              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={1}>
                  Prompt Variables:
                </Text>
                <Text fontSize="sm">
                  Use these variables in your prompt:
                </Text>
                <Text fontSize="sm" as="ul" pl={5}>
                  <Text as="li">{'{title}'} - Episode title</Text>
                  <Text as="li">{'{transcript}'} - Episode transcript</Text>
                  <Text as="li">{'{duration}'} - Episode duration</Text>
                  <Text as="li">{'{date}'} - Recording date</Text>
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="gray" 
              mr={3} 
              onClick={handleResetToDefault}
            >
              Reset to Default
            </Button>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSavePrompt}
              isDisabled={!isEdited}
            >
              Save Prompt
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PromptEditor;