
import React, { useState } from 'react';
import { PodcastPlayer } from './components/PodcastPlayer';
import { InteractiveTabs } from './components/InteractiveTabs';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-400 tracking-tight">
            Naija NewsCast
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Your Daily Dose of Nigerian News, Powered by AI
          </p>
        </header>

        <main>
          <div className="max-w-4xl mx-auto">
            <PodcastPlayer />
            <div className="mt-12">
              <InteractiveTabs />
            </div>
          </div>
        </main>
        
        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>&copy; 2024 Naija NewsCast. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
