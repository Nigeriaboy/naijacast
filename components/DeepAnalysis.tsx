
import React, { useState } from 'react';
import { getComplexAnalysis } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { BrainIcon } from './icons/SimpleIcons';

export const DeepAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResult('');
    setError(null);

    try {
      const analysis = await getComplexAnalysis(query);
      setResult(analysis);
    } catch (err) {
      console.error('Deep Analysis Error:', err);
      setError('Failed to get analysis. The model may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-700 backdrop-blur-sm">
      <p className="text-gray-400 text-sm mb-4">Ask a complex question for in-depth analysis. Powered by gemini-2.5-pro with thinking mode enabled.</p>
      
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g., Analyze the long-term economic impact of Nigeria's recent tech-sector policies mentioned in the news..."
        className="w-full h-32 bg-gray-900/70 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        disabled={isLoading}
      />
      
      <div className="flex justify-center mt-4">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5 mr-2" />
              <span>Analyzing...</span>
            </>
          ) : (
             <>
              <BrainIcon className="w-5 h-5 mr-2" />
              <span>Analyze Query</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="mt-4 text-center text-red-400 p-3 bg-red-900/50 rounded-lg">{error}</div>}

      {result && (
        <div className="mt-6 p-4 bg-gray-900/70 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">Analysis Result:</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
};
