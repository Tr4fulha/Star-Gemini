import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ShipConfig, GameResult } from '../types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameEngineProps {
  ship: ShipConfig;
  inventory: string[];
  onGameOver: (result: GameResult) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ ship, inventory, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hearts, setHearts] = useState(ship.health + (inventory.includes('reinforced_hull') ? 1 : 0));
  const [scrap, setScrap] = useState(0);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [dashCooldown, setDashCooldown] = useState(0);
  
  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});
  const touchInput = useRef<{ x: number, y: number, fire: boolean, dash: boolean, ultra: boolean }>({
    x: 0, y: 0, fire: false, dash: false, ultra: false
  });

  // Game Loop Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Game Entities
    let animationFrameId: number;
    let lastTime = 0;
    
    // Player State
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 100,
      width: 40,
      height: 40,
      speed: ship.speed * 60, // Normalize speed for delta time
      color: ship.color,
      invulnerable: 0,
      weaponLevel: inventory.includes('weapon_preheat') ? 2 : 1
    };

    const bullets: any[] = [];
    const enemies: any[] = [];
    const particles: any[] = [];
    const loot: any[] = [];
    
    let enemySpawnTimer = 0;
    let gameScore = 0;
    let gameScrap = 0;

    // Helper functions
    const spawnEnemy = () => {
      const size = 30 + Math.random() * 20;
      enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 100 + Math.random() * 100 + (wave * 10),
        hp: 1 + Math.floor(wave / 2),
        type: Math.random() > 0.8 ? 'shooter' : 'charger'
      });
    };

    const createExplosion = (x: number, y: number, color: string) => {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 400,
          vy: (Math.random() - 0.5) * 400,
          life: 0.5 + Math.random() * 0.5,
          color: color,
          size: Math.random() * 4
        });
      }
    };

    const gameLoop = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (!ctx) return;

      // CLEAR
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // STARFIELD BACKGROUND
      ctx.fillStyle = '#ffffff';
      for(let i=0; i<5; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }

      // ---------------- UPDATE ----------------

      // Player Movement
      let dx = 0;
      let dy = 0;

      // Keyboard
      if (keys.current['ArrowUp'] || keys.current['w']) dy = -1;
      if (keys.current['ArrowDown'] || keys.current['s']) dy = 1;
      if (keys.current['ArrowLeft'] || keys.current['a']) dx = -1;
      if (keys.current['ArrowRight'] || keys.current['d']) dx = 1;

      // Touch
      if (touchInput.current.x !== 0) dx = touchInput.current.x;
      if (touchInput.current.y !== 0) dy = touchInput.current.y;

      // Apply Movement
      if (dx !== 0 || dy !== 0) {
        // Normalize vector
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
          dx /= length;
          dy /= length;
        }
        player.x += dx * player.speed * dt;
        player.y += dy * player.speed * dt;
      }

      // Clamp Player
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
      player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

      // Shooting (Auto-fire if holding space or touch button)
      if (keys.current[' '] || touchInput.current.fire) {
        if (timestamp % 200 < 20) { // Simple cooldown based on frame time modulo
           // Center shot
           bullets.push({ x: player.x + player.width/2 - 2, y: player.y, w: 4, h: 15, vy: -600, color: '#ffff00' });
           if (player.weaponLevel > 1) {
             bullets.push({ x: player.x, y: player.y + 10, w: 3, h: 12, vy: -550, vx: -100, color: '#ffff00' });
             bullets.push({ x: player.x + player.width, y: player.y + 10, w: 3, h: 12, vy: -550, vx: 100, color: '#ffff00' });
           }
        }
      }

      // Dash Logic
      if (touchInput.current.dash) {
        // Simple visual feedback for dash, mechanics would go here
        touchInput.current.dash = false;
        createExplosion(player.x + player.width/2, player.y + player.height, '#00f0ff');
      }

      // Spawn Enemies
      enemySpawnTimer += dt;
      if (enemySpawnTimer > Math.max(0.5, 2 - (wave * 0.1))) {
        spawnEnemy();
        enemySpawnTimer = 0;
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += (b.vx || 0) * dt;
        b.y += b.vy * dt;
        if (b.y < -50) bullets.splice(i, 1);
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed * dt;

        // Collision: Enemy vs Player
        if (
          player.invulnerable <= 0 &&
          e.x < player.x + player.width &&
          e.x + e.width > player.x &&
          e.y < player.y + player.height &&
          e.y + e.height > player.y
        ) {
          player.invulnerable = 2; // 2 seconds invuln
          setHearts(h => {
             const newH = h - 1;
             if (newH <= 0) {
               onGameOver({ score: gameScore, scrapCollected: gameScrap, survivedWaves: wave });
             }
             return newH;
          });
          createExplosion(player.x, player.y, '#ff0000');
          enemies.splice(i, 1);
          continue;
        }

        // Collision: Bullet vs Enemy
        for (let j = bullets.length - 1; j >= 0; j--) {
          let b = bullets[j];
          if (
            b.x < e.x + e.width &&
            b.x + b.w > e.x &&
            b.y < e.y + e.height &&
            b.y + b.h > e.y
          ) {
            e.hp--;
            createExplosion(b.x, b.y, '#ffaa00');
            bullets.splice(j, 1);
            if (e.hp <= 0) {
              gameScore += 100;
              setScore(gameScore);
              
              // Drop scrap
              if (Math.random() > 0.5) {
                loot.push({x: e.x + e.width/2, y: e.y, size: 8, type: 'scrap'});
              }

              createExplosion(e.x + e.width/2, e.y + e.height/2, '#ff0000');
              enemies.splice(i, 1);
            }
            break;
          }
        }

        if (e.y > canvas.height) enemies.splice(i, 1);
      }

      // Update Loot
      const magnetRange = inventory.includes('gravity_well') ? 200 : 100;
      for (let i = loot.length - 1; i >= 0; i--) {
        let l = loot[i];
        
        // Magnet effect
        const dx = (player.x + player.width/2) - l.x;
        const dy = (player.y + player.height/2) - l.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < magnetRange) {
          l.x += (dx / dist) * 400 * dt;
          l.y += (dy / dist) * 400 * dt;
        } else {
          l.y += 50 * dt; // Drift down
        }

        // Collection
        if (dist < 40) {
          gameScrap += 10;
          setScrap(gameScrap);
          loot.splice(i, 1);
        } else if (l.y > canvas.height) {
          loot.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (player.invulnerable > 0) player.invulnerable -= dt;


      // ---------------- DRAW ----------------

      // Draw Enemies
      enemies.forEach(e => {
        ctx.fillStyle = '#ff0044';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0044';
        
        // Enemy Shape
        ctx.beginPath();
        if (e.type === 'shooter') {
           // Triangle down
           ctx.moveTo(e.x, e.y);
           ctx.lineTo(e.x + e.width, e.y);
           ctx.lineTo(e.x + e.width/2, e.y + e.height);
        } else {
           // Box with spike
           ctx.fillRect(e.x, e.y, e.width, e.height);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Bullets
      ctx.fillStyle = '#ffff00';
      bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // Draw Loot
      loot.forEach(l => {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Player
      if (player.invulnerable <= 0 || Math.floor(timestamp / 100) % 2 === 0) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        
        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        
        // Ship Body
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(0, -player.height/2); // Nose
        ctx.lineTo(player.width/2, player.height/2); // Right wing
        ctx.lineTo(0, player.height/4); // Engine notch
        ctx.lineTo(-player.width/2, player.height/2); // Left wing
        ctx.closePath();
        ctx.fill();

        // Engine flame
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-5, player.height/4);
        ctx.lineTo(5, player.height/4);
        ctx.lineTo(0, player.height/2 + (Math.random() * 20));
        ctx.fill();

        ctx.restore();
      }

      // Draw Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    // Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [ship, inventory, wave]);

  // Touch Handlers
  const setMove = (x: number, y: number) => { touchInput.current.x = x; touchInput.current.y = y; };
  const setAction = (action: 'fire' | 'dash' | 'ultra', val: boolean) => { touchInput.current[action] = val; };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
        <div>
          <h2 className="text-neon-cyan font-display text-2xl tracking-widest">{score.toString().padStart(6, '0')}</h2>
          <p className="text-xs text-gray-400">WAVE {wave}</p>
          <div className="flex items-center gap-1 mt-1">
             <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
             <span className="text-neon-yellow font-bold">{scrap}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: Math.max(0, hearts) }).map((_, i) => (
             <div key={i} className="text-red-500 text-2xl">♥</div>
          ))}
        </div>
      </div>

      {/* Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-2 z-20 md:hidden">
        <div></div>
        <button 
          className="w-12 h-12 bg-slate-800/80 rounded border border-gray-600 active:bg-neon-cyan/50 flex items-center justify-center text-white"
          onTouchStart={() => setMove(0, -1)} onTouchEnd={() => setMove(0, 0)}
        >
          <ChevronUp />
        </button>
        <div></div>
        
        <button 
          className="w-12 h-12 bg-slate-800/80 rounded border border-gray-600 active:bg-neon-cyan/50 flex items-center justify-center text-white"
          onTouchStart={() => setMove(-1, 0)} onTouchEnd={() => setMove(0, 0)}
        >
          <ChevronLeft />
        </button>
        <button className="w-12 h-12 bg-blue-900/50 rounded flex items-center justify-center text-xs font-display text-white border border-blue-500"
          onTouchStart={() => setAction('dash', true)}
        >
          DASH
        </button>
        <button 
          className="w-12 h-12 bg-slate-800/80 rounded border border-gray-600 active:bg-neon-cyan/50 flex items-center justify-center text-white"
          onTouchStart={() => setMove(1, 0)} onTouchEnd={() => setMove(0, 0)}
        >
          <ChevronRight />
        </button>

        <div></div>
        <button 
          className="w-12 h-12 bg-slate-800/80 rounded border border-gray-600 active:bg-neon-cyan/50 flex items-center justify-center text-white"
          onTouchStart={() => setMove(0, 1)} onTouchEnd={() => setMove(0, 0)}
        >
          <ChevronDown />
        </button>
        <div></div>
      </div>

      <div className="absolute bottom-16 right-4 flex flex-col gap-4 z-20 md:hidden">
        <button className="w-16 h-16 rounded-xl border-2 border-yellow-500 bg-yellow-900/40 text-yellow-400 font-bold text-xs shadow-lg active:scale-95"
          onTouchStart={() => setAction('ultra', true)}
        >
          ULTRA
        </button>
        <button 
          className="w-24 h-24 rounded-full border-4 border-neon-cyan bg-cyan-900/40 text-neon-cyan font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 flex items-center justify-center"
          onTouchStart={() => setAction('fire', true)} onTouchEnd={() => setAction('fire', false)}
        >
          ATIRAR
        </button>
      </div>

       {/* Desktop hint */}
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-sm">
        WASD to Move • SPACE to Shoot
      </div>
    </div>
  );
};