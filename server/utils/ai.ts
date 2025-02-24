import OpenAI from "openai";
import { type Episode } from "@shared/schema";
import https from "https";
import { Readable } from "stream";
import { URL } from "url";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import fetch from "node-fetch";


export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    console.log('[Transcription] Starting transcription for URL:', audioUrl);

    let audioFilePath: string;

    if (audioUrl.startsWith('/uploads/')) {
      // For local files in the uploads directory
      audioFilePath = path.join(process.cwd(), audioUrl);
      console.log('[Transcription] Using local file path:', audioFilePath);

      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found at path: ${audioFilePath}`);
      }
    } else if (audioUrl.startsWith('http')) {
      // For remote URLs, download the file first
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      audioFilePath = `/tmp/audio-${Date.now()}.webm`;
      fs.writeFileSync(audioFilePath, Buffer.from(buffer));
      console.log('[Transcription] Downloaded remote file to:', audioFilePath);
    } else {
      throw new Error('Invalid audio URL format');
    }

    try {
      console.log('[Transcription] Initiating OpenAI API call...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        language: "en",
        response_format: "text"
      });

      console.log('[Transcription] OpenAI API call successful');

      // Clean up temp file if it was downloaded
      if (audioFilePath.startsWith('/tmp/')) {
        fs.unlinkSync(audioFilePath);
      }

      return transcription;
    } catch (error) {
      console.error('[Transcription] OpenAI API error:', error);
      throw error;
    }
  } catch (error) {
    console.error("[Transcription] Error:", error);
    throw new Error("Failed to transcribe audio: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function generateTitleSuggestions(transcript: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

export async function generateShowNotes(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are a professional podcast show notes writer. Create detailed, structured show notes from the provided transcript.
Format the output in Markdown with:
- A brief episode summary at the top (2-3 sentences)
- Key topics discussed with timestamps
- Notable quotes
- Key takeaways or action items
- Resources mentioned (if any)

Use proper Markdown formatting including:
- Headers (##) for sections
- Bullet points for lists
- > for quotes
- *italics* for emphasis on important points`
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

export async function generateTags(transcript: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      model: "gpt-4o",
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