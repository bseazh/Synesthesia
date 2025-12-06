import * as Tone from 'tone';
import { KEY_MAPPING, LANE_CONFIG } from '../constants';
import { Song, SongNote } from '../types';

class AudioService {
  private synth: Tone.PolySynth | null = null;
  private membrane: Tone.MembraneSynth | null = null;
  private metal: Tone.MetalSynth | null = null;
  private backingSynth: Tone.PolySynth | null = null; 
  private songPart: Tone.Part | null = null;
  private player: Tone.Player | null = null; // For uploaded audio
  private isInitialized = false;
  private instrumentMode: 'synth' | 'percussion' = 'synth';

  constructor() {
    // Lazy initialization
  }

  public async init() {
    if (this.isInitialized) return;
    
    await Tone.start();
    
    // Main polyphonic synth
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 1 }
    }).toDestination();
    if (this.synth) this.synth.volume.value = -6;

    // Backing Synth
    this.backingSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    if (this.backingSynth) this.backingSynth.volume.value = -12;

    this.membrane = new Tone.MembraneSynth().toDestination();
    
    this.metal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    if (this.metal) {
      this.metal.volume.value = -10;
      this.metal.frequency.value = 200;
    }

    this.isInitialized = true;
  }

  public setMode(mode: 'synth' | 'percussion') {
    this.instrumentMode = mode;
  }

  public playSound(key: string, forceNote?: string) {
    if (!this.isInitialized) return;
    // Map space to C2 if standard mapping fails, but space is in mapping now
    const config = KEY_MAPPING[key.toLowerCase()];
    if (!config && !forceNote) return;

    const noteToPlay = forceNote || config?.soundNote;

    if (this.instrumentMode === 'synth') {
       if (noteToPlay && this.synth) {
         this.synth.triggerAttackRelease(noteToPlay, "8n");
       }
    } else {
      const row1 = "qwertyuiop";
      const row2 = "asdfghjkl";
      const row3 = "zxcvbnm";
      
      if (key === ' ' && this.membrane) {
         this.membrane.triggerAttackRelease("C1", "8n");
      } else if (row3.includes(key) && this.membrane) {
        this.membrane.triggerAttackRelease(noteToPlay || "C2", "8n");
      } else if (row2.includes(key) && this.metal) {
        this.metal.triggerAttackRelease("C4", "32n");
      } else if (row1.includes(key) && this.synth) {
        this.synth.triggerAttackRelease(noteToPlay || "C6", "32n");
      }
    }
  }

  public playMissSound() {
    if (!this.isInitialized || !this.membrane) return;
    this.membrane.triggerAttackRelease("G1", "16n");
  }

  // --- Song & Analysis Logic ---

  public async processUserAudio(file: File): Promise<Song> {
    if (!this.isInitialized) await this.init();

    const arrayBuffer = await file.arrayBuffer();
    const context = Tone.getContext() as any;
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    // Dynamic Threshold Beat Detection
    // This looks for drum beats (low frequency energy) specifically.
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const notes: SongNote[] = [];
    
    // Window size for analysis (approx 20ms)
    const bufferSize = Math.floor(sampleRate / 50); 
    const minBeatInterval = 0.25; // Max 240 BPM (0.25s interval)
    let lastBeatTime = -minBeatInterval;

    // Track energy history to calculate dynamic threshold
    const historyBuffer: number[] = [];
    const historySize = 40; // Look back ~800ms

    let previousLaneIndex = 3; // Start at center (Space)
    
    for (let i = 0; i < channelData.length; i += bufferSize) {
        // Calculate RMS of this window
        let sum = 0;
        for (let j = 0; j < bufferSize && i + j < channelData.length; j++) {
            const val = channelData[i + j];
            sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferSize);

        // Calculate average energy of local history
        let historySum = 0;
        if (historyBuffer.length > 0) {
            historySum = historyBuffer.reduce((a, b) => a + b, 0);
        }
        const averageEnergy = historyBuffer.length > 0 ? historySum / historyBuffer.length : 0;
        
        // Push current RMS to history
        historyBuffer.push(rms);
        if (historyBuffer.length > historySize) historyBuffer.shift();

        // BEAT DETECTION LOGIC
        // If current energy is significantly higher than local average
        // And we haven't detected a beat recently
        const currentTime = i / sampleRate;
        const threshold = 1.3; // Sensitivity (1.3x average)
        
        if (rms > averageEnergy * threshold && rms > 0.05) {
             if (currentTime - lastBeatTime > minBeatInterval) {
                 
                 // --- Lane Selection Logic (Musical Flow) ---
                 // Instead of random, we move stepwise or bounce.
                 // Lanes: 0(A) 1(S) 2(D) 3(Sp) 4(J) 5(K) 6(L)
                 
                 let nextLane = 3;
                 
                 const r = Math.random();
                 if (r > 0.7) {
                    // Jump (Cross hand)
                    nextLane = Math.floor(Math.random() * 7);
                 } else {
                    // Step (Flow)
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    nextLane = previousLaneIndex + dir;
                    // Bounce off edges
                    if (nextLane < 0) nextLane = 1;
                    if (nextLane > 6) nextLane = 5;
                 }
                 
                 const key = LANE_CONFIG[nextLane].key;
                 
                 notes.push({
                     time: currentTime + 2.0, // 2s delay for gameplay start
                     key: key,
                     duration: 0.2,
                     laneIndex: nextLane
                 });

                 lastBeatTime = currentTime;
                 previousLaneIndex = nextLane;
             }
        }
    }

    return {
        id: `custom_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Custom Track',
        bpm: 120, 
        difficulty: 'Medium',
        notes: notes,
        audioBuffer: audioBuffer,
        sourceType: 'UPLOAD'
    };
  }

  public async startSong(song: Song, onComplete: () => void) {
    if (!this.isInitialized) await this.init();

    // Reset
    this.stopSong();

    if (song.sourceType === 'UPLOAD' && song.audioBuffer) {
        // --- CUSTOM SONG MODE ---
        this.player = new Tone.Player(song.audioBuffer).toDestination();
        
        // Start playback with 2s delay to match notes
        this.player.start(Tone.now() + 2.0); 
        
        Tone.Transport.start();
        
        const duration = song.audioBuffer.duration + 4;
        Tone.Transport.schedule(() => {
            onComplete();
            this.stopSong();
        }, duration);

    } else {
        // --- PRESET MODE ---
        // Ensure notes are sorted
        const sortedNotes = [...song.notes].sort((a, b) => a.time - b.time);
        
        this.songPart = new Tone.Part((time, note: SongNote) => {
           const config = KEY_MAPPING[note.key];
           if (config && config.soundNote && this.backingSynth) {
               this.backingSynth.triggerAttackRelease(config.soundNote, note.duration || "8n", time);
           }
        }, sortedNotes).start(0);

        Tone.Transport.bpm.value = song.bpm;
        Tone.Transport.start();

        const lastNote = sortedNotes[sortedNotes.length - 1];
        const endTime = lastNote ? lastNote.time + 4 : 5;
        Tone.Transport.schedule(() => {
            onComplete();
            this.stopSong();
        }, endTime);
    }
  }

  public stopSong() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (this.songPart) { this.songPart.dispose(); this.songPart = null; }
    if (this.player) { this.player.stop(); this.player.dispose(); this.player = null; }
  }

  public getTransport() {
      return Tone.Transport;
  }
}

export const audioService = new AudioService();
