import React, { useState } from 'react';
import { Settings, Music, HelpCircle, X, Keyboard, Info, Volume2, Gamepad2 } from 'lucide-react';

interface ControlsProps {
  onInstrumentChange: (mode: 'synth' | 'percussion') => void;
  currentMode: 'synth' | 'percussion';
  lastKeyPressed: string | null;
  onOpenGameMode: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onInstrumentChange, currentMode, lastKeyPressed, onOpenGameMode }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Top Bar - Persistent Controls */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
        
        {/* Brand / Last Key */}
        <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white flex items-center gap-3 shadow-lg">
           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-200 ${lastKeyPressed ? 'bg-white text-black scale-110' : 'bg-white/10 text-white/50'}`}>
              {lastKeyPressed ? lastKeyPressed.toUpperCase() : <Keyboard size={20}/>}
           </div>
           <div className="hidden sm:block">
             <h1 className="font-bold text-lg tracking-wider">SYNESTHESIA</h1>
             <p className="text-xs text-white/60">Free Play Mode</p>
           </div>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex flex-col gap-2">
           <button 
            onClick={onOpenGameMode}
            className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full border border-white/10 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg mb-2"
            title="Play Game Mode"
           >
            <Gamepad2 size={24} />
           </button>

           <button 
            onClick={() => setShowHelp(true)}
            className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
            title="Help"
           >
            <HelpCircle size={20} />
           </button>
           
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`w-12 h-12 backdrop-blur-md rounded-full border border-white/10 text-white flex items-center justify-center transition-all shadow-lg ${showSettings ? 'bg-indigo-500' : 'bg-black/40 hover:bg-white/20'}`}
             title="Settings"
           >
            <Settings size={20} />
           </button>
        </div>
      </div>

      {/* Settings Dropdown Panel */}
      {showSettings && (
        <div className="absolute top-36 right-4 w-64 bg-black/80 backdrop-blur-lg border border-white/10 rounded-2xl p-4 z-20 text-white shadow-2xl animate-fade-in-down">
          <h3 className="text-sm font-bold mb-4 text-white/70 uppercase tracking-widest border-b border-white/10 pb-2">Sound Config</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2"><Music size={16}/> Synth Mode</span>
              <input 
                type="radio" 
                name="instrument" 
                checked={currentMode === 'synth'}
                onChange={() => onInstrumentChange('synth')}
                className="accent-indigo-500 w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2"><Volume2 size={16}/> Percussion Mode</span>
              <input 
                type="radio" 
                name="instrument" 
                checked={currentMode === 'percussion'}
                onChange={() => onInstrumentChange('percussion')}
                className="accent-pink-500 w-5 h-5"
              />
            </label>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">How to Play</h2>
              <p className="text-white/60">Turn your keyboard into an audiovisual synthesizer.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <Keyboard className="text-indigo-400 mb-2" />
                <h3 className="font-bold text-white">Press Keys</h3>
                <p className="text-sm text-white/50">A-Z keys trigger unique sounds and visual shapes.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <Gamepad2 className="text-pink-400 mb-2" />
                <h3 className="font-bold text-white">Game Mode</h3>
                <p className="text-sm text-white/50">Select a song and hit the targets to the rhythm.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowHelp(false)}
              className="mt-8 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Controls;