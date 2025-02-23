import OpenAI from "openai";
import { type Episode } from "@shared/schema";
import https from "https";
import { Readable } from "stream";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Download the audio file using https
    const audioStream = await new Promise<Readable>((resolve, reject) => {
      https.get(audioUrl, (response) => {
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

export async function generateShowNotes(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional podcast show notes writer. Create detailed, well-structured show notes from the provided transcript. Include key points, topics discussed, and any notable quotes."
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
  const [showNotes, tags, summary] = await Promise.all([
    generateShowNotes(transcript),
    generateTags(transcript),
    generateSummary(transcript)
  ]);

  return {
    transcript,
    showNotes,
    aiGeneratedTags: tags,
    aiGeneratedSummary: summary,
    transcriptionStatus: 'completed' as const
  };
}