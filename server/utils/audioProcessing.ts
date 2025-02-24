// server/utils/audioProcessing.ts
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';

// Set ffmpeg path for Replit environment
ffmpeg.setFfmpegPath(ffmpegPath.path);

interface ProcessAudioOptions {
  introPath?: string | null;
  mainAudioPath: string;
  outroPath?: string | null;
  outputPath: string;
}

export async function concatenateAudio({
  introPath,
  mainAudioPath,
  outroPath,
  outputPath
}: ProcessAudioOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Starting audio concatenation with:', {
      introPath,
      mainAudioPath,
      outroPath,
      outputPath
    });

    // Create a temporary file list for concatenation
    const tempFilePath = path.join(process.cwd(), 'temp_file_list.txt');
    const filePaths = [
      introPath,
      mainAudioPath,
      outroPath
    ].filter(Boolean) as string[];

    // Create the file list content
    const fileList = filePaths.map(file => `file '${file}'`).join('\n');
    fs.writeFileSync(tempFilePath, fileList);

    console.log('Created temp file list:', fileList);

    ffmpeg()
      .input(tempFilePath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions('-c copy')
      .on('start', (command) => {
        console.log('Started ffmpeg with command:', command);
      })
      .on('progress', (progress) => {
        console.log('Processing: ', progress.percent, '% done');
      })
      .on('end', () => {
        console.log('Audio concatenation completed');
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        reject(err);
      })
      .save(outputPath);
  });
}