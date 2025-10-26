
import React, { useState, useCallback } from 'react';
import { getNewsSummaryAndSources, generateAudioFromText } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { PlayIcon, NewspaperIcon } from './icons/SimpleIcons';

interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export const PodcastPlayer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePodcast = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setSources([]);

    try {
      setLoadingStep('Gathering latest news from top Nigerian sources...');
      const { summary, sources: newsSources } = await getNewsSummaryAndSources();
      
      if (newsSources) {
        setSources(newsSources);
      }

      setLoadingStep('Synthesizing news summary into audio...');
      const audioBlob = await generateAudioFromText(summary);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (err) {
      console.error(err);
      setError('Failed to generate podcast. Please try again later.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, []);

  return (
    <section className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-emerald-300 mb-4 flex items-center">
        <NewspaperIcon className="w-6 h-6 mr-3" />
        Today's News Briefing
      </h2>
      <p className="text-gray-400 mb-6">
        Click the button below to generate a new audio podcast summarizing today's top headlines from Nigeria.
      </p>
      
      <div className="flex justify-center mb-6">
        <button
          onClick={handleGeneratePodcast}
          disabled={isLoading}
          className="flex items-center justify-center px-8 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-6 h-6 mr-3" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-6 h-6 mr-3" />
              <span>Generate Today's Podcast</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-emerald-400 p-4 bg-gray-700/50 rounded-lg">
          <p>{loadingStep}</p>
        </div>
      )}

      {error && <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}

      {audioUrl && (
        <div className="mt-6">
          <audio controls src={audioUrl} className="w-full rounded-lg">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      
      {sources.length > 0 && (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Sources</h3>
            <ul className="space-y-2">
                {sources.filter(s => s.web).map((source, index) => (
                    <li key={index} className="bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <a 
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
                        >
                            {source.web.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </section>
  );
};
