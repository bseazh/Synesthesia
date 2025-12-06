import { KeyConfig, ShapeType, Song, SongNote } from './types';

export const COLORS = [
  '#F94144', '#F3722C', '#F8961E', '#F9844A', '#F9C74F', 
  '#90BE6D', '#43AA8B', '#4D908E', '#577590', '#277DA1',
  '#FF006E', '#8338EC', '#3A86FF'
];

// Map keyboard keys to specific shapes, colors, and notes
export const KEY_MAPPING: Record<string, KeyConfig> = {
  // Row 1 (QWERTY...) - High / Synth
  'q': { key: 'q', color: '#F94144', shape: ShapeType.CIRCLE, soundNote: 'C5' },
  'w': { key: 'w', color: '#F3722C', shape: ShapeType.SQUARE, soundNote: 'D5' },
  'e': { key: 'e', color: '#F8961E', shape: ShapeType.TRIANGLE, soundNote: 'E5' },
  'r': { key: 'r', color: '#F9844A', shape: ShapeType.LINE_BURST, soundNote: 'F5' },
  't': { key: 't', color: '#F9C74F', shape: ShapeType.CONFETTI, soundNote: 'G5' },
  'y': { key: 'y', color: '#90BE6D', shape: ShapeType.RIPPLE, soundNote: 'A5' },
  'u': { key: 'u', color: '#43AA8B', shape: ShapeType.CIRCLE, soundNote: 'B5' },
  'i': { key: 'i', color: '#4D908E', shape: ShapeType.SQUARE, soundNote: 'C6' },
  'o': { key: 'o', color: '#577590', shape: ShapeType.TRIANGLE, soundNote: 'D6' },
  'p': { key: 'p', color: '#277DA1', shape: ShapeType.LINE_BURST, soundNote: 'E6' },
  
  // Row 2 (ASDFG...) - Mids / Pads
  'a': { key: 'a', color: '#FF006E', shape: ShapeType.CONFETTI, soundNote: 'C4' },
  's': { key: 's', color: '#8338EC', shape: ShapeType.RIPPLE, soundNote: 'D4' },
  'd': { key: 'd', color: '#3A86FF', shape: ShapeType.CIRCLE, soundNote: 'E4' },
  'f': { key: 'f', color: '#FFBE0B', shape: ShapeType.SQUARE, soundNote: 'F4' },
  'g': { key: 'g', color: '#FB5607', shape: ShapeType.TRIANGLE, soundNote: 'G4' },
  'h': { key: 'h', color: '#FF006E', shape: ShapeType.LINE_BURST, soundNote: 'A4' },
  'j': { key: 'j', color: '#8338EC', shape: ShapeType.CONFETTI, soundNote: 'B4' },
  'k': { key: 'k', color: '#3A86FF', shape: ShapeType.RIPPLE, soundNote: 'C5' },
  'l': { key: 'l', color: '#F94144', shape: ShapeType.CIRCLE, soundNote: 'D5' },
  
  // Row 3 (ZXCVB...) - Lows / Bass
  'z': { key: 'z', color: '#F3722C', shape: ShapeType.SQUARE, soundNote: 'C3' },
  'x': { key: 'x', color: '#F8961E', shape: ShapeType.TRIANGLE, soundNote: 'D3' },
  'c': { key: 'c', color: '#F9844A', shape: ShapeType.LINE_BURST, soundNote: 'E3' },
  'v': { key: 'v', color: '#F9C74F', shape: ShapeType.CONFETTI, soundNote: 'F3' },
  'b': { key: 'b', color: '#90BE6D', shape: ShapeType.RIPPLE, soundNote: 'G3' },
  'n': { key: 'n', color: '#43AA8B', shape: ShapeType.CIRCLE, soundNote: 'A3' },
  'm': { key: 'm', color: '#4D908E', shape: ShapeType.SQUARE, soundNote: 'B3' },
  
  // Special Keys
  ' ': { key: ' ', color: '#FFFFFF', shape: ShapeType.LINE_BURST, soundNote: 'C2' }, // Spacebar
};

// 7-Key Lane Configuration
// A S D [Space] J K L
export const LANE_CONFIG = [
    { key: 'a', label: 'A', color: '#FF006E' }, // Pink
    { key: 's', label: 'S', color: '#8338EC' }, // Purple
    { key: 'd', label: 'D', color: '#3A86FF' }, // Blue
    { key: ' ', label: 'SPACE', color: '#FFFFFF' }, // White
    { key: 'j', label: 'J', color: '#FFBE0B' }, // Yellow
    { key: 'k', label: 'K', color: '#FB5607' }, // Orange
    { key: 'l', label: 'L', color: '#F94144' }, // Red
];

// --- Song Data ---

const createAdvancedOdeToJoy = () => {
    const notes: SongNote[] = [];
    let currentTime = 2.5; // Start delay
    const standardBeat = 0.5; // 120 BPM base
    
    const addNote = (key: string, beats: number, tempoScale = 1.0) => {
        const duration = beats * standardBeat * tempoScale;
        notes.push({
            time: currentTime,
            key,
            duration: duration
        });
        currentTime += duration;
    };

    // --- PHASE 1: STANDARD (Row 2 Keys) ---
    // E E F G | G F E D | C C D E | E. D D
    const PHRASE_1_KEYS = ['d', 'd', 'f', 'g', 'g', 'f', 'd', 's', 'a', 'a', 's', 'd'];
    PHRASE_1_KEYS.forEach(k => addNote(k, 1));
    addNote('d', 1.5); addNote('s', 0.5); addNote('s', 2);

    // E E F G | G F E D | C C D E | D. C C
    const PHRASE_2_KEYS = ['d', 'd', 'f', 'g', 'g', 'f', 'd', 's', 'a', 'a', 's', 'd'];
    PHRASE_2_KEYS.forEach(k => addNote(k, 1));
    addNote('s', 1.5); addNote('a', 0.5); addNote('a', 2);

    // --- PHASE 2: BRIDGE (Complex Rhythm) ---
    // D D E C | D E F E C | D E F E D | C D G(low)
    // Keys: S S D A | S D F D A | S D F D S | A S B
    
    // D D E C
    addNote('s', 1); addNote('s', 1); addNote('d', 1); addNote('a', 1);
    
    // D E F E C (Accelerated triplets feel)
    addNote('s', 1); addNote('d', 0.5); addNote('f', 0.5); addNote('d', 1); addNote('a', 1);
    
    // D E F E D
    addNote('s', 1); addNote('d', 0.5); addNote('f', 0.5); addNote('d', 1); addNote('s', 1);
    
    // C D G(low) - "B" is G3 in mapping
    addNote('a', 1); addNote('s', 1); addNote('b', 2);


    // --- PHASE 3: FINALE (High Pitch + Fast) ---
    // Shift to Row 1 (QWERTY)
    // C5(q) D5(w) E5(e) F5(r) G5(t)
    // Melody: E E F G ...
    
    currentTime += 0.5; // Dramatic pause
    const fastScale = 0.75; // 25% Faster (~160 BPM)

    const HIGH_KEYS = ['e', 'e', 'r', 't', 't', 'r', 'e', 'w', 'q', 'q', 'w', 'e'];
    HIGH_KEYS.forEach(k => addNote(k, 1, fastScale));
    
    // Ending: D. C C (High: W. Q Q)
    addNote('w', 1.5, fastScale); 
    addNote('q', 0.5, fastScale); 
    addNote('q', 2, fastScale);

    return notes;
};

const createSimpleOdeToJoy = () => {
    const notes: SongNote[] = [];
    let currentTime = 2.5; 
    const beat = 0.6; // Slower 100 BPM

    // Simplified melody, mapped to ASDFG only
    // E E F G | G F E D
    const k = ['d', 'd', 'f', 'g', 'g', 'f', 'd', 's'];
    k.forEach(key => {
        notes.push({ time: currentTime, key, duration: beat });
        currentTime += beat;
    });

    // C C D E | E D D
    const k2 = ['a', 'a', 's', 'd', 'd', 's', 's'];
    k2.forEach((key, i) => {
        const dur = (i === 4) ? beat * 1.5 : (i === 5) ? beat * 0.5 : (i === 6) ? beat * 2 : beat;
        notes.push({ time: currentTime, key, duration: dur });
        currentTime += dur;
    });

    return notes;
};

export const SONGS: Song[] = [
  {
    id: 'ode_to_joy_simple',
    title: 'Ode to Joy (Beginner)',
    artist: 'Beethoven',
    bpm: 100,
    difficulty: 'Easy',
    notes: createSimpleOdeToJoy(),
    sourceType: 'PRESET'
  },
  {
    id: 'ode_to_joy_adv',
    title: 'Ode to Joy (Symphony)',
    artist: 'Beethoven',
    bpm: 120,
    difficulty: 'Medium',
    notes: createAdvancedOdeToJoy(),
    sourceType: 'PRESET'
  }
];