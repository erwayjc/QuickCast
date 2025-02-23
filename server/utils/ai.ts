import OpenAI from "openai";
import { type Episode } from "@shared/schema";
import https from "https";
import { Readable } from "stream";
import { URL } from "url";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Get the full URL if it's a relative path
    const fullUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${process.env.REPL_PROTOCOL}://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co${audioUrl}`;

    console.log('Attempting to transcribe audio from URL:', fullUrl);

    // Download the audio file using https
    const audioStream = await new Promise<Readable>((resolve, reject) => {
      https.get(fullUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download audio: ${response.statusCode}`));
          return;
        }
        resolve(response);
      }).on('error', reject);
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioStream as any,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Failed to transcribe audio:", error);
    throw new Error("Failed to transcribe audio");
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
  const transcript = await transcribeAudio(episode.audioUrl);
  const [titleSuggestions, showNotes, tags, summary] = await Promise.all([
    generateTitleSuggestions(transcript),
    generateShowNotes(transcript),
    generateTags(transcript),
    generateSummary(transcript)
  ]);

  return {
    transcript,
    showNotes,
    aiGeneratedTags: tags,
    aiGeneratedSummary: summary,
    titleSuggestions: titleSuggestions,
    transcriptionStatus: 'completed' as const
  };
}