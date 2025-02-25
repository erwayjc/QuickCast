import { getCustomPrompt, getDefaultPrompt, getPodcastInfo } from './promptService';

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
  [key: string]: string;
}

// Generate content using OpenAI API
export const generateAIContent = async (sectionId: string, episode: Episode): Promise<string> => {
  try {
    // Get podcast info
    const podcastInfo = await getPodcastInfo();

    // Get custom prompt or default prompt
    const customPrompt = await getCustomPrompt(sectionId);
    const defaultPrompt = getDefaultPrompt(sectionId);
    const promptToUse = customPrompt || defaultPrompt;

    // Replace variables in the prompt
    const processedPrompt = promptToUse
      .replace(/{host}/g, podcastInfo?.hostName || 'the host')
      .replace(/{audience}/g, podcastInfo?.targetAudience || 'the audience')
      .replace(/{title}/g, episode.title || '')
      .replace(/{transcript}/g, episode.transcript || '')
      .replace(/{duration}/g, episode.duration || '')
      .replace(/{date}/g, episode.recordedAt || new Date().toISOString());

    // In development, we can use mock responses to avoid API costs
    if (process.env.REACT_APP_MOCK_AI === 'true') {
      return mockAIResponse(sectionId, episode, podcastInfo);
    }

    // Make actual API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: processedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error generating content');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error('Failed to generate content: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Mock AI responses for testing without API calls
const mockAIResponse = (sectionId: string, episode: Episode, podcastInfo: any): Promise<string> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const title = episode.title || 'Untitled Episode';
      const hostName = podcastInfo?.hostName || 'the host';
      const audience = podcastInfo?.targetAudience || 'the audience';

      // Different mock responses based on section
      const mockResponses: Record<string, string> = {
        'overview': `In this episode, ${hostName} discusses the process of creating a new app. Key topics include app design, understanding user needs, and development strategies. This episode is specifically tailored for ${audience} looking to enter the app development space.`,

        'transcript': `${hostName}: Welcome to the podcast! Today we're discussing app development.\n\n${hostName}: Let's talk about design first. Design is crucial...\n\n${hostName}: Next, understanding user needs...\n\n${hostName}: Finally, let's discuss development strategies that work best for ${audience}...`,

        'show-notes': `# Episode: ${title}\n\nIn this episode, ${hostName} shares valuable insights on app development for ${audience}.\n\n## Key Points\n- App design principles (03:15)\n- User research methods (08:42)\n- Development workflow (15:30)\n\n## Resources Mentioned\n- Adobe XD for design\n- React Native for development\n- User testing platforms`,

        'tags': `app development, mobile design, user experience, ${hostName}, podcast, ${audience}, programming, software, tech startup, UI design, UX research, development workflow, coding, app launch, product design`,

        'titles': `1. "${hostName} Reveals the App Development Process"\n2. "From Concept to Launch: The App Development Journey with ${hostName}"\n3. "Building Apps That ${audience} Will Love"\n4. "The Ultimate Guide to App Creation for ${audience}"\n5. "App Development Demystified by ${hostName}"`,

        'process': `1. Define the app concept and goals (tailored for ${audience})\n2. Research target users and competitors\n3. Create wireframes and design mockups\n4. Develop MVP (Minimum Viable Product)\n5. Test with real users from ${hostName}'s audience\n6. Iterate based on feedback\n7. Prepare for launch\n8. Monitor and update post-launch`
      };

      resolve(mockResponses[sectionId] || `Generated content for ${sectionId} by ${hostName} for ${audience}`);
    }, 1500); // Simulate 1.5 second delay
  });
};