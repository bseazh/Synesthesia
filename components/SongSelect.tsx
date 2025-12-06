import React, { useRef } from 'react';
import { SONGS } from '../constants';
import { Song } from '../types';
import { audioService } from '../services/audioService';
import { Play, Music, ArrowLeft, Upload, Zap } from 'lucide-react';

interface SongSelectProps {
  onSelect: (song: Song) => void;
  onBack: () => void;
}

const SongSelect: React.FC<SongSelectProps> = ({ onSelect, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Analyze
      try {
          const customSong = await audioService.processUserAudio(file);
          onSelect(customSong);
      } catch (err) {
          console.error("Failed to load song", err);
          alert("Could not load audio file. Please try a valid MP3/WAV.");
      }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl pt-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Free Play
        </button>
        
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
            <div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">Select a Track</h2>
                <p className="text-white/40">Choose a preset or upload your own.</p>
            </div>
            
            {/* Upload Button */}
            <div className="relative">
                 <input 
                    type="file" 
                    accept="audio/*" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
                 >
                    <Upload size={18} /> Upload Song
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preset Songs */}
          {SONGS.map((song) => (
            <div 
              key={song.id}
              onClick={() => onSelect(song)}
              className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer hover:border-indigo-500/50"
            >
              <div className="flex items-start justify-between">
                <div>
                   <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{song.title}</h3>
                   <p className="text-white/50 text-sm flex items-center gap-2 mt-1"><Music size={14}/> {song.artist}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    song.difficulty === 'Easy' ? 'border-green-500/30 text-green-400' : 
                    song.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                    'border-red-500/30 text-red-400'
                  }`}>
                    {song.difficulty}
                  </span>
                  <span className="text-white/30 text-xs mt-2">{song.bpm} BPM</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white/40 group-hover:text-white transition-colors">
                <Play size={16} fill="currentColor" /> Play Bubble Mode
              </div>
            </div>
          ))}
          
          {/* Challenge Mode Explainer Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 mt-4">
              <div className="p-4 bg-white/10 rounded-full">
                  <Zap size={32} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Challenge Mode</h3>
                  <p className="text-white/60 text-sm mt-1">Upload any song to generate a custom 7-key rhythm track. <br/>Controls: <span className="text-yellow-400 font-mono">A S D [Space] J K L</span></p>
              </div>
              <div className="text-white/30 text-sm italic">
                  Supported formats: MP3, WAV
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SongSelect;