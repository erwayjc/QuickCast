// utils/ai.ts
import OpenAI from "openai";
import { type Episode } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateShowNotes(transcript: string): Promise<string> {
  try {
    // Fixed model name from "gpt-4o" to "gpt-4"
    const response = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if you prefer
      messages: [
        {
          role: "system",
          content: "You are a professional podcast show notes writer. Create detailed, well-structured show notes from the provided transcript. Include key points, topics discussed, timestamps for important moments, and any notable quotes. Format with Markdown for better readability."
        },
        {
          role: "user",
          content: transcript
        }
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Failed to generate show notes:", error);
    throw new Error("Failed to generate show notes");
  }
}

export async function generateTitleSuggestions(transcript: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Fixed model name
      messages: [
        {
          role: "system",
          content: "You are a podcast title expert. Generate 3 engaging, SEO-friendly title suggestions based on the transcript. Return them as a JSON array of strings."
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const result = JSON.parse(content);
    return result.titles || [];
  } catch (error) {
    console.error("Failed to generate title suggestions:", error);
    throw new Error("Failed to generate title suggestions");
  }
}

export async function generateTags(transcript: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Fixed model name
      messages: [
        {
          role: "system",
          content: "Generate relevant tags or keywords from the transcript. Return them as a JSON array of strings. Maximum 10 tags."
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const result = JSON.parse(content);
    return result.tags || [];
  } catch (error) {
    console.error("Failed to generate tags:", error);
    throw new Error("Failed to generate tags");
  }
}

export async function generateSummary(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Fixed model name
      messages: [
        {
          role: "system",
          content: "Create a concise summary of the podcast episode from the transcript. Focus on the main topics and key takeaways. Keep it under 200 words."
        },
        {
          role: "user",
          content: transcript
        }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Failed to generate summary:", error);
    throw new Error("Failed to generate summary");
  }
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Get the full URL if it's a relative path
    const fullUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${process.env.REPL_URL}${audioUrl}`;

    console.log('[Transcription] Starting transcription for URL:', fullUrl);

    // Download the audio file first
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "text"
    });

    console.log('[Transcription] Completed successfully');
    return transcription;
  } catch (error) {
    console.error("[Transcription] Error:", error);
    throw error;
  }
}

export async function processEpisode(episode: Episode): Promise<Partial<Episode>> {
  try {
    console.log('[ProcessEpisode] Starting processing for episode:', episode.id);

    const transcript = await transcribeAudio(episode.audioUrl);
    console.log('[ProcessEpisode] Transcription completed, length:', transcript.length);

    console.log('[ProcessEpisode] Starting parallel AI processing tasks');
    const [titleSuggestions, showNotes, tags, summary] = await Promise.all([
      generateTitleSuggestions(transcript),
      generateShowNotes(transcript),
      generateTags(transcript),
      generateSummary(transcript)
    ]);
    console.log('[ProcessEpisode] AI processing tasks completed');

    return {
      transcript,
      showNotes,
      aiGeneratedTags: tags,
      aiGeneratedSummary: summary,
      titleSuggestions,
      transcriptionStatus: 'completed' as const
    };
  } catch (error) {
    console.error('[ProcessEpisode] Error processing episode:', error);
    throw error;
  }
}