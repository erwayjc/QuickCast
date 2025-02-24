import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Flex,
  Heading,
  Textarea,
  HStack,
  VStack,
  IconButton,
  Divider,
  useToast,
  Badge,
  Spinner
} from '@chakra-ui/react';
import { 
  PlayIcon, 
  DeleteIcon, 
  EditIcon, 
  ChevronRightIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraftEpisode, updateDraftEpisode, generateAIContent } from '../services/episodeService';
import { getDefaultPrompt, getCustomPrompt } from '../services/promptService';
import PromptEditor from './PromptEditor';

const Drafts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isGenerating, setIsGenerating] = useState({
    overview: false,
    transcript: false,
    showNotes: false,
    tags: false,
    titles: false,
    process: false
  });

  // Fetch episode data
  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        setLoading(true);
        const data = await getDraftEpisode(id);
        setEpisode(data);
      } catch (error) {
        toast({
          title: 'Error loading episode',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEpisode();
    }
  }, [id, toast]);

  // Handle content updates
  const handleContentUpdate = async (section, value) => {
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
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle AI content generation
  const handleGenerateContent = async (section) => {
    if (!episode) return;

    try {
      // Set the corresponding section to generating state
      setIsGenerating(prev => ({
        ...prev,
        [section]: true
      }));

      // Get custom prompt or default prompt
      const sectionId = getSectionId(section);
      const customPrompt = await getCustomPrompt(sectionId);
      const defaultPrompt = getDefaultPrompt(sectionId);
      const promptToUse = customPrompt || defaultPrompt;

      // Replace variables in the prompt
      const processedPrompt = promptToUse
        .replace('{title}', episode.title || '')
        .replace('{transcript}', episode.transcript || '')
        .replace('{duration}', episode.duration || '')
        .replace('{date}', episode.recordedAt || new Date().toISOString());

      // Call AI service to generate content
      const generatedContent = await generateAIContent(processedPrompt);

      // Update the episode with generated content
      const updatedEpisode = {
        ...episode,
        [section]: generatedContent
      };

      setEpisode(updatedEpisode);
      await updateDraftEpisode(id, { [section]: generatedContent });

      toast({
        title: 'Content generated',
        description: `${sectionToTitle(section)} has been generated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error generating content',
        description: error.message,
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

  // Helper function to map section to readable title
  const sectionToTitle = (section) => {
    const mapping = {
      overview: 'Overview',
      transcript: 'Transcript',
      showNotes: 'Show Notes',
      tags: 'Tags',
      titles: 'Titles',
      process: 'Process'
    };
    return mapping[section] || section;
  };

  // Helper function to get section ID for prompt storage
  const getSectionId = (section) => {
    const mapping = {
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
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading episode...</Text>
      </Box>
    );
  }

  if (!episode) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Episode not found</Text>
        <Button mt={4} onClick={() => navigate('/episodes')}>
          Back to Episodes
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">{episode.title || 'Untitled Episode'}</Heading>
          <HStack mt={1}>
            <Text color="gray.500">{episode.duration || '0:00'}</Text>
            <Text color="gray.500">•</Text>
            <Text color="gray.500">
              {episode.recordedAt 
                ? new Date(episode.recordedAt).toLocaleDateString() 
                : 'Draft'}
            </Text>
            {episode.status && (
              <Badge colorScheme={episode.status === 'published' ? 'green' : 'orange'}>
                {episode.status.charAt(0).toUpperCase() + episode.status.slice(1)}
              </Badge>
            )}
          </HStack>
        </Box>

        <HStack>
          <Button 
            leftIcon={<PlayIcon />} 
            colorScheme="blue"
            onClick={() => navigate(`/preview/${id}`)}
          >
            Play
          </Button>
          <Button 
            leftIcon={<DeleteIcon />} 
            colorScheme="red"
            variant="outline"
          >
            Delete
          </Button>
        </HStack>
      </Flex>

      <Tabs 
        index={activeTab} 
        onChange={setActiveTab}
        variant="enclosed"
        colorScheme="red"
      >
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Transcript</Tab>
          <Tab>Show Notes</Tab>
          <Tab>Tags</Tab>
          <Tab>Titles</Tab>
          <Tab>Process</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Overview</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.overview ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('overview')}
                  isDisabled={isGenerating.overview}
                >
                  {isGenerating.overview ? 'Generating...' : 'Generate with AI'}
                </Button>
                <PromptEditor 
                  sectionId="overview" 
                  sectionName="Overview" 
                  defaultPrompt={getDefaultPrompt('overview')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.overview || ''}
              onChange={(e) => handleContentUpdate('overview', e.target.value)}
              placeholder="Enter episode overview..."
              minHeight="200px"
            />
          </TabPanel>

          {/* Transcript Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Transcript</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.transcript ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('transcript')}
                  isDisabled={isGenerating.transcript}
                >
                  {isGenerating.transcript ? 'Generating...' : 'Clean Up with AI'}
                </Button>
                <PromptEditor 
                  sectionId="transcript" 
                  sectionName="Transcript" 
                  defaultPrompt={getDefaultPrompt('transcript')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.transcript || ''}
              onChange={(e) => handleContentUpdate('transcript', e.target.value)}
              placeholder="Enter episode transcript..."
              minHeight="300px"
            />
          </TabPanel>

          {/* Show Notes Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Show Notes</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.showNotes ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('showNotes')}
                  isDisabled={isGenerating.showNotes}
                >
                  {isGenerating.showNotes ? 'Generating...' : 'Generate with AI'}
                </Button>
                <PromptEditor 
                  sectionId="show-notes" 
                  sectionName="Show Notes" 
                  defaultPrompt={getDefaultPrompt('show-notes')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.showNotes || ''}
              onChange={(e) => handleContentUpdate('showNotes', e.target.value)}
              placeholder="Enter show notes..."
              minHeight="250px"
            />
          </TabPanel>

          {/* Tags Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Tags</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.tags ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('tags')}
                  isDisabled={isGenerating.tags}
                >
                  {isGenerating.tags ? 'Generating...' : 'Generate with AI'}
                </Button>
                <PromptEditor 
                  sectionId="tags" 
                  sectionName="Tags" 
                  defaultPrompt={getDefaultPrompt('tags')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.tags || ''}
              onChange={(e) => handleContentUpdate('tags', e.target.value)}
              placeholder="Enter episode tags (comma separated)..."
              minHeight="150px"
            />
          </TabPanel>

          {/* Titles Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Alternative Titles</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.titles ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('titles')}
                  isDisabled={isGenerating.titles}
                >
                  {isGenerating.titles ? 'Generating...' : 'Generate with AI'}
                </Button>
                <PromptEditor 
                  sectionId="titles" 
                  sectionName="Titles" 
                  defaultPrompt={getDefaultPrompt('titles')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.titles || ''}
              onChange={(e) => handleContentUpdate('titles', e.target.value)}
              placeholder="Enter alternative titles..."
              minHeight="150px"
            />
          </TabPanel>

          {/* Process Tab */}
          <TabPanel>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold">Process/Steps</Text>
              <HStack>
                <Button
                  leftIcon={isGenerating.process ? <Spinner size="sm" /> : <RepeatIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleGenerateContent('process')}
                  isDisabled={isGenerating.process}
                >
                  {isGenerating.process ? 'Generating...' : 'Generate with AI'}
                </Button>
                <PromptEditor 
                  sectionId="process" 
                  sectionName="Process" 
                  defaultPrompt={getDefaultPrompt('process')} 
                />
              </HStack>
            </Flex>
            <Textarea
              value={episode.process || ''}
              onChange={(e) => handleContentUpdate('process', e.target.value)}
              placeholder="Enter process or steps from the episode..."
              minHeight="200px"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Drafts;