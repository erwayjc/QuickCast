// Service to handle AI interactions
import { getCustomPrompt, getDefaultPrompt } from './promptService';

// Generate content using OpenAI API
export const generateAIContent = async (sectionId, episode) => {
  try {
    // Get custom prompt or default prompt
    const customPrompt = await getCustomPrompt(sectionId);
    const defaultPrompt = getDefaultPrompt(sectionId);
    const promptToUse = customPrompt || defaultPrompt;

    // Replace variables in the prompt
    const processedPrompt = promptToUse
      .replace('{title}', episode.title || '')
      .replace('{transcript}', episode.transcript || '')
      .replace('{duration}', episode.duration || '')
      .replace('{date}', episode.recordedAt || new Date().toISOString());

    // In development, we can use mock responses to avoid API costs
    if (process.env.REACT_APP_MOCK_AI === 'true') {
      return mockAIResponse(sectionId, episode);
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
    throw new Error('Failed to generate content: ' + (error.message || 'Unknown error'));
  }
};

// Mock AI responses for testing without API calls
const mockAIResponse = (sectionId, episode) => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const title = episode.title || 'Untitled Episode';

      // Different mock responses based on section
      const mockResponses = {
        'overview': `This is a mock overview for "${title}". In this episode, the host discusses the process of creating a new app. Key topics include app design, understanding user needs, and development strategies.`,

        'transcript': `Host: Welcome to the podcast! Today we're discussing app development.\n\nHost: Let's talk about design first. Design is crucial...\n\nHost: Next, understanding user needs...\n\nHost: Finally, let's discuss development strategies...`,

        'show-notes': `# Episode ${title}\n\n## Key Points\n- App design principles (03:15)\n- User research methods (08:42)\n- Development workflow (15:30)\n\n## Resources Mentioned\n- Adobe XD for design\n- React Native for development\n- User testing platforms`,

        'tags': `app development, mobile design, user experience, programming, software, tech startup, UI design, UX research, development workflow, coding, app launch, product design`,

        'titles': `1. "${title}"\n2. "From Concept to Launch: The App Development Journey"\n3. "Building Apps That Users Love"\n4. "The Ultimate Guide to App Creation"\n5. "App Development Demystified"`,

        'process': `1. Define the app concept and goals\n2. Research target users and competitors\n3. Create wireframes and design mockups\n4. Develop MVP (Minimum Viable Product)\n5. Test with real users\n6. Iterate based on feedback\n7. Prepare for launch\n8. Monitor and update post-launch`
      };

      resolve(mockResponses[sectionId] || `Generated content for ${sectionId}`);
    }, 1500); // Simulate 1.5 second delay
  });
};