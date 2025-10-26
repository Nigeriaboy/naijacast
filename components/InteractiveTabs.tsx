
import React, { useState } from 'react';
import { QuickChat } from './QuickChat';
import { DeepAnalysis } from './DeepAnalysis';
import { LiveConversation } from './LiveConversation';
import { ChatBubbleIcon, BrainIcon, MicrophoneIcon } from './icons/SimpleIcons';

const TABS = [
  { id: 'chat', name: 'Quick Chat', icon: ChatBubbleIcon, component: QuickChat },
  { id: 'analysis', name: 'Deep Analysis', icon: BrainIcon, component: DeepAnalysis },
  { id: 'live', name: 'Talk with AI', icon: MicrophoneIcon, component: LiveConversation },
];

export const InteractiveTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || (() => null);

  return (
    <div className="w-full">
      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
            >
              <tab.icon className="w-5 h-5 mr-2"/>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};
