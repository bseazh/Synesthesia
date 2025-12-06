import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioService } from './services/audioService';
import Visualizer, { VisualizerHandle } from './components/Visualizer';
import Controls from './components/Controls';
import SongSelect from './components/SongSelect';
import { KEY_MAPPING, LANE_CONFIG } from './constants';
import { GameTarget, GameState, Song, HitRating } from './types';
import { Trophy } from 'lucide-react';

type AppMode = 'FREE' | 'SONG_SELECT' | 'GAME_PLAYING' | 'GAME_RESULTS';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('FREE');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [instrumentMode, setInstrumentMode] = useState<'synth' | 'percussion'>('synth');
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  
  // Game State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [gameModeType, setGameModeType] = useState<'BUBBLE' | 'LANE'>('BUBBLE');
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    health: 100,
    accuracy: 100,
  });
  const [gameTargets, setGameTargets] = useState<GameTarget[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const visualizerRef = useRef<VisualizerHandle>(null);
  const requestRef = useRef<number | null>(null);
  
  // Game Logic Refs
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const hitsRef = useRef(0);
  const missRef = useRef(0);

  const handleStart = async () => {
    try {
      await audioService.init();
      setHasInteracted(true);
    } catch (e) {
      console.error("Failed to initialize audio:", e);
    }
  };

  const handleInstrumentChange = (mode: 'synth' | 'percussion') => {
    setInstrumentMode(mode);
    audioService.setMode(mode);
  };

  const startGame = useCallback(async (song: Song) => {
    setCurrentSong(song);
    
    // Determine Mode
    const isUpload = song.sourceType === 'UPLOAD';
    const modeType = isUpload ? 'LANE' : 'BUBBLE';
    setGameModeType(modeType);
    setMode('GAME_PLAYING');
    
    // Reset Stats
    setGameState({
      isPlaying: true,
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 100,
      accuracy: 100
    });
    scoreRef.current = 0;
    comboRef.current = 0;
    hitsRef.current = 0;
    missRef.current = 0;

    // Generate Targets
    const { innerWidth, innerHeight } = window;
    const targets: GameTarget[] = song.notes.map((note, index) => {
        let x = 0;
        let y = 0;
        
        if (modeType === 'BUBBLE') {
            x = innerWidth * 0.2 + Math.random() * (innerWidth * 0.6);
            y = innerHeight * 0.2 + Math.random() * (innerHeight * 0.6);
        }
        
        return {
          id: `target-${index}`,
          key: note.key,
          hitTime: note.time,
          spawnTime: note.time - 2.0, 
          x,
          y,
          isHit: false,
          isMissed: false,
          color: isUpload 
              ? LANE_CONFIG[note.laneIndex || 0].color 
              : (KEY_MAPPING[note.key]?.color || '#fff'),
          laneIndex: note.laneIndex
        };
    });
    
    setGameTargets(targets);

    // Start Audio
    // Important: Wait for audio to be ready before calling this, safe check in audioService
    if (gameState.isPlaying) audioService.stopSong();

    await audioService.startSong(song, () => {
       // Check if unmounted or mode changed?
       endGame();
    });
  }, []);

  const endGame = useCallback(() => {
    // Safety check to avoid loops
    setMode(prev => {
        if (prev === 'GAME_RESULTS') return prev;
        audioService.stopSong();
        return 'GAME_RESULTS';
    });
  }, []);

  const gameLoop = useCallback(() => {
    if (mode !== 'GAME_PLAYING') return;

    const transport = audioService.getTransport();
    const time = transport.seconds;
    setCurrentTime(time);

    setGameTargets(prev => {
        let hasChanges = false;
        const newTargets = prev.map(t => {
            // "Miss" window: if note is 0.2s past the hit line
            const missWindow = 0.2; 
            if (!t.isHit && !t.isMissed && time > t.hitTime + missWindow) {
                missRef.current += 1;
                comboRef.current = 0;
                audioService.playMissSound();
                visualizerRef.current?.drawGameFeedback('MISS');
                hasChanges = true;
                return { ...t, isMissed: true };
            }
            return t;
        });
        
        if (hasChanges) {
             const totalNotes = hitsRef.current + missRef.current;
             const accuracy = totalNotes === 0 ? 100 : Math.round((hitsRef.current / totalNotes) * 100);
             setGameState(s => ({ ...s, combo: 0, accuracy, lastRating: 'MISS' }));
             return newTargets;
        }
        return prev;
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [mode]);

  useEffect(() => {
     if (mode === 'GAME_PLAYING') {
         requestRef.current = requestAnimationFrame(gameLoop);
     }
     return () => {
         if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
     }
  }, [mode, gameLoop]);


  // --- Input Handling ---

  const triggerFreePlayKey = useCallback((key: string) => {
    audioService.playSound(key);
    visualizerRef.current?.addShape(key);
    setLastKeyPressed(key);
    setTimeout(() => setLastKeyPressed(prev => prev === key ? null : prev), 200);
  }, []);

  const triggerGameKey = useCallback((key: string) => {
    const time = audioService.getTransport().seconds;
    
    // Hit Windows (Seconds)
    const EXCELLENT = 0.08; 
    const GREAT = 0.15;     
    const GOOD = 0.25;      
    
    setGameTargets(prev => {
        // Find targets that match key, haven't been hit, and are within the GOOD window (abs diff)
        const targetsInWindow = prev.map((t, i) => ({ ...t, index: i, diff: Math.abs(time - t.hitTime) }))
            .filter(t => 
                t.key === key && 
                !t.isHit && 
                !t.isMissed && 
                t.diff <= GOOD
            );

        // Sort by closest time
        targetsInWindow.sort((a, b) => a.diff - b.diff);

        if (targetsInWindow.length > 0) {
            const hitTarget = targetsInWindow[0];
            const diff = hitTarget.diff;
            let rating: HitRating = 'GOOD';
            let scoreAdd = 50;
            
            if (diff <= EXCELLENT) { rating = 'EXCELLENT'; scoreAdd = 300; }
            else if (diff <= GREAT) { rating = 'GREAT'; scoreAdd = 150; }

            const newTargets = [...prev];
            newTargets[hitTarget.index] = { ...prev[hitTarget.index], isHit: true };
            
            visualizerRef.current?.addShape(key, true);
            visualizerRef.current?.drawGameFeedback(rating);

            // Score Calculation
            scoreRef.current += scoreAdd + (comboRef.current * 5);
            comboRef.current += 1;
            hitsRef.current += 1;
            
            const totalNotes = hitsRef.current + missRef.current;
            const accuracy = Math.round((hitsRef.current / totalNotes) * 100);

            setGameState(s => ({
                ...s,
                score: scoreRef.current,
                combo: comboRef.current,
                maxCombo: Math.max(s.maxCombo, comboRef.current),
                accuracy,
                lastRating: rating
            }));
            
            return newTargets;
        } else {
            return prev;
        }
    });
    
    setLastKeyPressed(key);
    setTimeout(() => setLastKeyPressed(prev => prev === key ? null : prev), 100);

  }, [gameModeType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasInteracted) return;
      if (e.repeat) return;
      
      const key = e.key.toLowerCase();
      setActiveKeys(prev => [...prev, key]);

      if (mode === 'GAME_PLAYING') {
          if (gameModeType === 'LANE') {
              const validKeys = LANE_CONFIG.map(l => l.key);
              if (validKeys.includes(key)) triggerGameKey(key);
          } else {
              if (KEY_MAPPING[key]) triggerGameKey(key);
          }
      } else if (mode === 'FREE') {
          if (KEY_MAPPING[key]) triggerFreePlayKey(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       setActiveKeys(prev => prev.filter(k => k !== e.key.toLowerCase()));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasInteracted, mode, triggerFreePlayKey, triggerGameKey, gameModeType]);

  return (
    <div 
      className="w-screen h-screen bg-[#1a1a1a] overflow-hidden relative"
      onTouchStart={() => !hasInteracted && handleStart()}
    >
      <Visualizer 
        ref={visualizerRef} 
        onCanvasReady={() => console.log('Canvas ready')}
        gameTargets={mode === 'GAME_PLAYING' ? gameTargets : undefined}
        currentTime={currentTime}
        gameMode={gameModeType}
        activeKeys={activeKeys}
      />

      {/* Intro */}
      {!hasInteracted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="text-center p-6 animate-pulse">
             <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 tracking-tighter">
               SYNESTHESIA
             </h1>
             <p className="text-gray-400 mb-8 text-lg font-light">Interactive Audio-Visual Experience</p>
             <button 
               onClick={handleStart}
               className="px-8 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
             >
               Click to Start
             </button>
           </div>
        </div>
      )}

      {/* Song Select */}
      {mode === 'SONG_SELECT' && (
        <SongSelect 
          onSelect={startGame}
          onBack={() => setMode('FREE')}
        />
      )}

      {/* Game HUD */}
      {mode === 'GAME_PLAYING' && (
        <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-none z-20">
            <div className="flex flex-col gap-1">
                <div className="text-4xl font-bold text-white tabular-nums drop-shadow-lg">{gameState.score.toLocaleString()}</div>
                <div className="text-sm text-white/50 uppercase tracking-widest">Score</div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <div className="text-white/70 font-bold bg-black/30 backdrop-blur-sm px-4 py-1 rounded-full border border-white/10">
                    {currentSong?.title}
                </div>
                {/* Rating Pop-up */}
                {gameState.lastRating && (
                    <div className={`text-2xl font-black italic animate-bounce ${
                        gameState.lastRating === 'EXCELLENT' ? 'text-green-400' : 
                        gameState.lastRating === 'MISS' ? 'text-red-500' : 'text-yellow-400'
                    }`}>
                        {gameState.lastRating}
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-1">
                 <div className={`text-5xl font-black italic tracking-tighter drop-shadow-lg transition-all duration-100 ${gameState.combo > 10 ? 'text-yellow-400 scale-110' : 'text-white/20'}`}>
                    x{gameState.combo}
                 </div>
                 <div className="text-sm text-white/50 uppercase tracking-widest">Combo</div>
            </div>
        </div>
      )}

      {/* Results */}
      {mode === 'GAME_RESULTS' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
              <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center shadow-2xl animate-fade-in-up">
                  <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{currentSong?.title}</h2>
                  <p className="text-white/50 mb-8">
                     {gameState.accuracy > 90 ? 'Excellent Performance!' : 'Challenge Complete'}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-xl">
                          <div className="text-2xl font-bold text-white">{gameState.score}</div>
                          <div className="text-xs text-white/40 uppercase">Score</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl">
                          <div className="text-2xl font-bold text-indigo-400">{gameState.maxCombo}</div>
                          <div className="text-xs text-white/40 uppercase">Max Combo</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl">
                          <div className={`text-2xl font-bold ${gameState.accuracy > 90 ? 'text-green-400' : 'text-white'}`}>{gameState.accuracy}%</div>
                          <div className="text-xs text-white/40 uppercase">Accuracy</div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setMode('SONG_SELECT')}
                        className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                      >
                        Choose Song
                      </button>
                      <button 
                        onClick={() => { if (currentSong) startGame(currentSong); }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
                      >
                        Replay
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Free Play Controls */}
      {mode === 'FREE' && hasInteracted && (
        <>
            <Controls 
            onInstrumentChange={handleInstrumentChange}
            currentMode={instrumentMode}
            lastKeyPressed={lastKeyPressed}
            onOpenGameMode={() => setMode('SONG_SELECT')}
            />
            <div className="absolute bottom-10 right-10 z-10 hidden md:block">
                <div className="animate-bounce">
                    <button 
                        onClick={() => setMode('SONG_SELECT')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
                    >
                        <Trophy size={18} /> Play Game Mode
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default App;