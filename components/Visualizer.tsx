import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { KEY_MAPPING, LANE_CONFIG } from '../constants';
import { AnimationObject, ShapeType, GameTarget, HitRating } from '../types';

interface VisualizerProps {
  onCanvasReady: () => void;
  gameTargets?: GameTarget[]; 
  currentTime?: number;
  gameMode?: 'BUBBLE' | 'LANE';
  activeKeys?: string[]; // Keys currently being pressed
}

export interface VisualizerHandle {
  addShape: (key: string, isGameHit?: boolean) => void;
  drawGameFeedback: (rating: HitRating) => void;
}

// Reuse shape classes for effects
class ParticleEffect implements AnimationObject {
  id: string;
  type = ShapeType.CIRCLE;
  x: number;
  y: number;
  color: string;
  radius = 0;
  opacity = 1;
  isDead = false;

  constructor(x: number, y: number, color: string) {
    this.id = Math.random().toString();
    this.x = x;
    this.y = y;
    this.color = color;
  }
  
  update() {
    this.radius += 3;
    this.opacity -= 0.05;
    if (this.opacity <= 0) this.isDead = true;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class FloatingText implements AnimationObject {
    id: string;
    type = ShapeType.CONFETTI;
    x: number;
    y: number;
    text: string;
    color: string;
    opacity = 1;
    scale = 0.5;
    isDead = false;
    
    constructor(x: number, y: number, text: string, color: string) {
        this.id = Math.random().toString();
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
    }

    update() {
        this.y -= 3;
        this.opacity -= 0.02;
        if (this.scale < 1.5) this.scale += 0.1;
        if (this.opacity <= 0) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.fillStyle = this.color;
        ctx.font = "bold 60px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

class BubbleShape implements AnimationObject {
    id = Math.random().toString();
    type = ShapeType.CIRCLE;
    x: number; y: number; color: string;
    radius = 10; opacity = 1; isDead = false;
    constructor(x: number, y: number, color: string) { this.x=x; this.y=y; this.color=color; }
    update() { this.radius += 5; this.opacity -= 0.02; if(this.opacity<=0) this.isDead=true; }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity; ctx.fill(); ctx.globalAlpha=1;
    }
}


const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(({ onCanvasReady, gameTargets, currentTime, gameMode = 'BUBBLE', activeKeys }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<AnimationObject[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  const gameTargetsRef = useRef(gameTargets);
  const currentTimeRef = useRef(currentTime);
  const modeRef = useRef(gameMode);
  const activeKeysRef = useRef(activeKeys);
  
  useEffect(() => { gameTargetsRef.current = gameTargets; }, [gameTargets]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { modeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { activeKeysRef.current = activeKeys; }, [activeKeys]);

  useImperativeHandle(ref, () => ({
    addShape: (key: string, isGameHit = false) => {
      if (!canvasRef.current) return;
      const config = KEY_MAPPING[key.toLowerCase()];
      if (!config) return;
      const { width, height } = canvasRef.current;
      
      if (modeRef.current === 'LANE') {
          const laneIdx = LANE_CONFIG.findIndex(l => l.key === key.toLowerCase());
          if (laneIdx !== -1) {
              const laneWidth = Math.min(width / 7, 100);
              const totalWidth = laneWidth * 7;
              const startX = (width - totalWidth) / 2;
              const x = startX + (laneIdx * laneWidth) + (laneWidth/2);
              const y = height - 120; // Hit line Y
              shapesRef.current.push(new ParticleEffect(x, y, isGameHit ? '#fff' : config.color));
          }
      } else {
          const x = Math.random() * width;
          const y = Math.random() * height;
          shapesRef.current.push(new BubbleShape(x, y, config.color));
      }
    },
    drawGameFeedback: (rating: HitRating) => {
        if (!canvasRef.current) return;
        const { width, height } = canvasRef.current;
        let color = '#fff';
        let text = rating;
        
        switch(rating) {
            case 'EXCELLENT': color = '#22c55e'; break;
            case 'GREAT': color = '#eab308'; break;
            case 'GOOD': color = '#3b82f6'; break;
            case 'MISS': color = '#ef4444'; break;
        }

        shapesRef.current.push(new FloatingText(width/2, height * 0.4, text, color));
    }
  }));

  const drawLaneMode = (ctx: CanvasRenderingContext2D, width: number, height: number, targets: GameTarget[], time: number) => {
      const laneWidth = Math.min(width / 7, 100);
      const totalWidth = laneWidth * 7;
      const startX = (width - totalWidth) / 2;
      const hitLineY = height - 120;

      // Draw Lanes & Hit Line
      LANE_CONFIG.forEach((lane, i) => {
          const x = startX + (i * laneWidth);
          const isPressed = activeKeysRef.current?.includes(lane.key);
          
          // Lane Background
          ctx.fillStyle = isPressed ? `rgba(255,255,255, 0.1)` : `rgba(255,255,255, 0.02)`;
          ctx.fillRect(x, 0, laneWidth, height);
          
          // Lane Key Label
          ctx.fillStyle = isPressed ? '#fff' : lane.color;
          ctx.font = "bold 24px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(lane.label, x + laneWidth/2, height - 30);
          
          // Hit Target Box
          ctx.lineWidth = isPressed ? 4 : 2;
          ctx.strokeStyle = isPressed ? '#fff' : `rgba(255,255,255, 0.3)`;
          ctx.strokeRect(x + 5, hitLineY - 10, laneWidth - 10, 20);
      });

      // Draw Falling Notes
      const noteSpeed = 500; // px per second
      
      targets.forEach(target => {
          if (target.isHit) return;

          const timeDiff = target.hitTime - time;
          // Render if within visual range (2s ahead, 0.2s behind)
          if (timeDiff > 2.2 || timeDiff < -0.2) return;
          
          const y = hitLineY - (timeDiff * noteSpeed);
          
          let laneIdx = target.laneIndex;
          if (laneIdx === undefined) laneIdx = LANE_CONFIG.findIndex(l => l.key === target.key);
          if (laneIdx === -1 || laneIdx === undefined) return;

          const x = startX + (laneIdx * laneWidth) + (laneWidth/2);
          
          const noteHeight = 20;
          const noteWidth = laneWidth - 20;

          if (target.isMissed) {
              ctx.fillStyle = 'rgba(50,50,50, 0.5)'; // Greyed out
          } else {
              ctx.fillStyle = target.color;
              ctx.shadowColor = target.color;
              ctx.shadowBlur = 15;
          }
          
          // Draw Note
          ctx.fillRect(x - (noteWidth/2), y - (noteHeight/2), noteWidth, noteHeight);
          ctx.shadowBlur = 0; // Reset
      });
  };

  const drawBubbleMode = (ctx: CanvasRenderingContext2D, width: number, height: number, targets: GameTarget[], time: number) => {
        const keySize = 50;
        const gap = 10;
        const totalKeys = 5; 
        const startX = (width - ((keySize + gap) * totalKeys)) / 2;
        
        // Draw Virtual Keyboard Guide (Visual only)
        const keys = ['A', 'S', 'D', 'F', 'G'];
        keys.forEach((k, i) => {
             const kx = startX + (i * (keySize + gap));
             const ky = height - 100;
             const isActive = activeKeysRef.current?.includes(k.toLowerCase());
             
             ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.1)';
             ctx.fillRect(kx, ky, keySize, keySize);
             ctx.fillStyle = isActive ? '#000' : '#fff';
             ctx.font = "bold 20px 'Space Grotesk', sans-serif";
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillText(k, kx + keySize/2, ky + keySize/2);
        });

        if (targets) {
            targets.forEach(target => {
                if (target.isHit) return;
                const timeToHit = target.hitTime - time;
                if (timeToHit > 1.5 || timeToHit < -0.5) return; 

                const progress = Math.max(0, 1 - (timeToHit / 1.5));
                if (target.isMissed) {
                     ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                     ctx.font = "bold 40px Arial";
                     ctx.textAlign = "center";
                     ctx.fillText("X", target.x, target.y);
                     return;
                }

                ctx.beginPath();
                // Shape logic...
                ctx.arc(target.x, target.y, 40, 0, Math.PI * 2); 
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.stroke();

                const ringSize = 140 - (progress * 100); 
                if (ringSize >= 40) {
                    ctx.beginPath();
                    ctx.arc(target.x, target.y, ringSize, 0, Math.PI * 2);
                    ctx.strokeStyle = timeToHit < 0.2 ? target.color : `rgba(255, 255, 255, 0.8)`;
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }

                ctx.fillStyle = '#ffffff';
                ctx.font = "bold 32px 'Space Grotesk', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(target.key.toUpperCase(), target.x, target.y);
            });
        }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    onCanvasReady();

    const loop = () => {
        ctx.fillStyle = 'rgba(26, 26, 26, 0.3)'; // Trail effect
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const targets = gameTargetsRef.current || [];
        const time = currentTimeRef.current || 0;
        const mode = modeRef.current;

        if (mode === 'LANE') {
            drawLaneMode(ctx, width, height, targets, time);
        } else {
            drawBubbleMode(ctx, width, height, targets, time);
        }

        shapesRef.current.forEach(shape => {
            shape.update();
            shape.draw(ctx);
        });
        shapesRef.current = shapesRef.current.filter(s => !s.isDead);

        animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full z-0 touch-none"
    />
  );
});

Visualizer.displayName = 'Visualizer';
export default Visualizer;