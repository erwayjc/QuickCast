import React from 'react';
import { type transcriptionStatus } from '@shared/schema';

interface EpisodeProps {
  title: string;
  duration: string;
  date: string;
  isDraft?: boolean;
  transcriptionStatus?: (typeof transcriptionStatus.enumValues)[number];
  onPlay?: () => void;
  onTranscribe?: () => void;
  onDelete?: () => void;
}

const Episode: React.FC<EpisodeProps> = ({
  title,
  duration,
  date,
  isDraft = false,
  transcriptionStatus = 'pending',
  onPlay,
  onTranscribe,
  onDelete
}) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDraft && (
            <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded">
              Draft
            </span>
          )}
          {transcriptionStatus === 'processing' && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded animate-pulse">
              Transcribing...
            </span>
          )}
          {transcriptionStatus === 'completed' && (
            <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
              Transcribed
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5">⏱️</span>
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-5 h-5">📅</span>
            {date}
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            type="button"
          >
            <span>▶️</span>
            Play
          </button>

          {transcriptionStatus !== 'completed' && (
            <button
              onClick={onTranscribe}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
              type="button"
              disabled={transcriptionStatus === 'processing'}
            >
              <span>📝</span>
              {transcriptionStatus === 'processing' ? 'Transcribing...' : 'Transcribe'}
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
            type="button"
          >
            <span>🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Episode;