import OpenAI from "openai";
import { type Episode } from "@shared/schema";
import { db } from "../db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateShowNotes(transcript: string, hostName: string = 'the host'): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional podcast show notes writer. Create detailed, well-structured show notes from the provided transcript of ${hostName}'s podcast. Include key points, topics discussed, timestamps for important moments, and any notable quotes from ${hostName}. Format with Markdown for better readability.`
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

export async function generateTitleSuggestions(transcript: string, hostName: string = 'the host'): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a podcast title expert. Generate 3 engaging, SEO-friendly title suggestions for ${hostName}'s podcast episode based on the transcript. Return them as a JSON array of strings.`
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

export async function generateTags(transcript: string, hostName: string = 'the host'): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Generate relevant tags or keywords from ${hostName}'s podcast transcript. Return them as a JSON array of strings. Maximum 10 tags that best represent the episode's content and ${hostName}'s expertise.`
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

export async function generateSummary(transcript: string, hostName: string = 'the host'): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Create a concise summary of ${hostName}'s podcast episode from the transcript. Focus on the main topics and key takeaways that ${hostName} discussed. Keep it under 200 words.`
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
    const fullUrl = audioUrl;
    console.log('[Transcription] Starting transcription for URL:', fullUrl);

    // Download the audio file first
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' });

    console.log('[Transcription] Successfully downloaded audio, starting OpenAI transcription');

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
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
    throw error;
  }
}

export async function processEpisode(episode: Episode): Promise<Partial<Episode>> {
  try {
    console.log('[ProcessEpisode] Starting processing for episode:', episode.id);

    const transcript = await transcribeAudio(episode.audioUrl);
    console.log('[ProcessEpisode] Transcription completed, length:', transcript.length);

    // Get the template info and host name if available
    let hostName = 'the host';
    if (episode.templateId) {
      const [template] = await db
        .select()
        .from(schema.templates)
        .where(eq(schema.templates.id, episode.templateId));

      if (template) {
        hostName = template.hostName || hostName;
      }
    }

    console.log('[ProcessEpisode] Starting parallel AI processing tasks');
    const [titleSuggestions, showNotes, tags, summary] = await Promise.all([
      generateTitleSuggestions(transcript, hostName),
      generateShowNotes(transcript, hostName),
      generateTags(transcript, hostName),
      generateSummary(transcript, hostName)
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