import React from 'react';
import { Home, LineChart, SlidersHorizontal, Bot, Bookmark, Wallet } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAIChat: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAIChat,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around text-[10px] font-medium">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home size={18} />
        <span>Home</span>
      </button>

      <button
        onClick={() => onSelectTab('chart')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === 'chart' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LineChart size={18} />
        <span>Chart</span>
      </button>

      <button
        onClick={() => onSelectTab('portfolio')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === 'portfolio' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Wallet size={18} />
        <span>Assets</span>
      </button>

      <button
        onClick={onOpenAIChat}
        className="flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-300"
      >
        <div className="w-8 h-8 -mt-3 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
          <Bot size={16} />
        </div>
        <span>AI Bot</span>
      </button>

      <button
        onClick={() => onSelectTab('watchlist')}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === 'watchlist' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Bookmark size={18} />
        <span>Watchlist</span>
      </button>
    </div>
  );
};

