import React, { useRef, useEffect, useState } from 'react';
import { ShipConfig, GameResult, PowerUpType, EnemyType } from '../types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Crosshair, ShieldAlert } from 'lucide-react';
import { sfx, music } from '../audioService';

interface GameEngineProps {
  ship: ShipConfig;
  inventory: string[];
  onGameOver: (result: GameResult) => void;
}

interface GameState {
  bullets: any[];
  enemyBullets: any[];
  enemies: any[];
  particles: any[];
  powerups: any[];
  floatingTexts: any[];
  missiles: any[];
  wingmen: any[];
  boss: any | null;
  waveKillCount: number;
  enemySpawnTimer: number;
  gameScore: number;
  gameScrap: number;
  gameXp: number;
  currentCombo: number;
  comboTimer: number;
  overdriveValue: number;
  overdriveTimer: number;
  shake: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ ship, inventory, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React State for UI
  const [hearts, setHearts] = useState(ship.health + (inventory.includes('reinforced_hull') ? 1 : 0));
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState({ current: 0, max: 0 });
  const [overdrive, setOverdrive] = useState(0);

  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});
  const touchInput = useRef<{ x: number, y: number, fire: boolean, dash: boolean, ultra: boolean }>({
    x: 0, y: 0, fire: false, dash: false, ultra: false
  });

  const pausedRef = useRef(false);
  
  const playerRef = useRef({
    x: 0, y: 0, vx: 0, vy: 0,
    width: 40, height: 40,
    invulnerable: 0,
    timers: { rapid_fire: 0, shield: 0, triple_shot: 0, laser: 0, wingman: 0 },
    weaponLevel: inventory.includes('weapon_preheat') ? 2 : 1
  });

  const gameState = useRef<GameState>({
    bullets: [], enemyBullets: [], enemies: [], particles: [], powerups: [],
    floatingTexts: [], missiles: [], wingmen: [], boss: null,
    waveKillCount: 0, enemySpawnTimer: 0, gameScore: 0, gameScrap: 0, gameXp: 0,
    currentCombo: 1, comboTimer: 0, overdriveValue: 0, overdriveTimer: 0, shake: 0
  });

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const handleInteraction = () => { sfx.init(); music.start(); };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      music.stop();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reset player position if off screen or initialization
      if (playerRef.current.x === 0 || playerRef.current.y > canvas.height) {
          playerRef.current.x = canvas.width / 2;
          playerRef.current.y = canvas.height * 0.75;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let animationFrameId: number;
    let lastTime = 0;
    let frameCount = 0;
    
    // Background Grid Variables
    let gridOffset = 0;
    
    const KILLS_TO_ADVANCE = 20; // Increased slightly
    const getDifficultyMult = () => Math.pow(1.15, wave - 1);

    // --- HELPER DRAW FUNCTIONS ---
    
    const drawGlowCircle = (x: number, y: number, radius: number, color: string, blur: number = 10) => {
       ctx.save();
       ctx.shadowBlur = blur;
       ctx.shadowColor = color;
       ctx.fillStyle = color;
       ctx.beginPath();
       ctx.arc(x, y, radius, 0, Math.PI * 2);
       ctx.fill();
       ctx.restore();
    };

    const drawVectorShip = (x: number, y: number, w: number, h: number, color: string, type: 'player' | EnemyType) => {
       ctx.save();
       ctx.translate(x + w/2, y + h/2);
       ctx.strokeStyle = color;
       ctx.lineWidth = 2;
       ctx.shadowBlur = 10;
       ctx.shadowColor = color;
       ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Transparent inner

       if (type === 'player') {
           ctx.beginPath();
           ctx.moveTo(0, -h/2);
           ctx.lineTo(w/2, h/2);
           ctx.lineTo(0, h/4);
           ctx.lineTo(-w/2, h/2);
           ctx.closePath();
           ctx.fill();
           ctx.stroke();
           // Engine Glow
           ctx.shadowBlur = 20;
           ctx.shadowColor = '#00ffff';
           ctx.fillStyle = '#00ffff';
           ctx.beginPath(); ctx.arc(0, h/3, 5, 0, Math.PI*2); ctx.fill();
       } else if (type === 'scout') { // Triangle
           ctx.beginPath();
           ctx.moveTo(0, h/2);
           ctx.lineTo(w/2, -h/2);
           ctx.lineTo(-w/2, -h/2);
           ctx.closePath();
           ctx.stroke();
       } else if (type === 'fighter') { // Winged
           ctx.beginPath();
           ctx.moveTo(0, h/2);
           ctx.lineTo(w/2, -h/4);
           ctx.lineTo(w/2, -h/2);
           ctx.lineTo(-w/2, -h/2);
           ctx.lineTo(-w/2, -h/4);
           ctx.closePath();
           ctx.stroke();
       } else if (type === 'tank') { // Boxy
           ctx.strokeRect(-w/2, -h/2, w, h);
           ctx.beginPath(); ctx.moveTo(-w/2, -h/2); ctx.lineTo(w/2, h/2); ctx.stroke();
           ctx.beginPath(); ctx.moveTo(w/2, -h/2); ctx.lineTo(-w/2, h/2); ctx.stroke();
       } else if (type === 'sniper') { // Long
           ctx.beginPath();
           ctx.moveTo(0, h/2);
           ctx.lineTo(w/4, -h/2);
           ctx.lineTo(-w/4, -h/2);
           ctx.closePath();
           ctx.stroke();
       } else if (type === 'mine') { // Spiky
           ctx.beginPath();
           const spikes = 8;
           for(let i=0; i<spikes*2; i++) {
               const r = (i%2===0) ? w/2 : w/4;
               const a = (Math.PI*2 * i) / (spikes*2);
               ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
           }
           ctx.closePath();
           ctx.stroke();
           ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
       } else {
           ctx.strokeRect(-w/2, -h/2, w, h);
       }
       ctx.restore();
    };

    const addShake = (amount: number) => { 
        gameState.current.shake = Math.min(30, gameState.current.shake + amount); 
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string, size: number = 14) => {
        gameState.current.floatingTexts.push({ x, y, text, color, size, life: 1.0, vy: -50 });
    };

    const createExplosion = (x: number, y: number, color: string, scale: number = 1) => {
      sfx.explosion();
      addShake(3 * scale);
      for (let i = 0; i < 15 * scale; i++) {
        gameState.current.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 400 * scale,
          vy: (Math.random() - 0.5) * 400 * scale,
          life: 0.5 + Math.random() * 0.5,
          color: color,
          size: Math.random() * 4 * scale
        });
      }
    };

    const spawnPowerUp = (x: number, y: number) => {
       const types: PowerUpType[] = [
           'health', 'triple_shot', 'rapid_fire', 'shield', 
           'missile', 'laser', 'nuke', 'wingman', 
           'kamikaze_drones', 'battery'
       ];
       const type = types[Math.floor(Math.random() * types.length)];
       gameState.current.powerups.push({ x, y, type, vy: 50, size: 20, timer: 0 });
    };

    const spawnBoss = () => {
      const mult = getDifficultyMult();
      const maxHp = 800 * mult;
      gameState.current.boss = {
        x: canvas.width / 2 - 60, y: -150, width: 120, height: 100,
        hp: maxHp, maxHp: maxHp, vx: 100, vy: 50,
        state: 'entering', timer: 0, color: '#ff0055'
      };
      setBossActive(true);
      setBossHp({ current: maxHp, max: maxHp });
      addShake(15);
      gameState.current.enemies.length = 0; 
      spawnFloatingText(canvas.width/2 - 100, canvas.height/2, "WARNING: BOSS DETECTED", "#ff0000", 24);
    };

    const spawnEnemy = () => {
      if (gameState.current.boss) return;
      const mult = getDifficultyMult();
      const typeRoll = Math.random();
      let type: EnemyType = 'scout';
      if (wave >= 2 && typeRoll > 0.6) type = 'fighter';
      if (wave >= 3 && typeRoll > 0.8) type = 'tank';
      if (wave >= 4 && typeRoll > 0.9) type = 'sniper';
      if (wave >= 5 && Math.random() > 0.95) type = 'swarm';

      let w = 30, h = 30, hp = 2, speed = 100, color = '#ff00aa'; 
      let shootChance = 0.5;
      
      switch (type) {
        case 'scout': w=25; h=25; hp=2 * mult; speed=150; color='#ff00aa'; shootChance=0.3; break;
        case 'fighter': w=35; h=35; hp=5 * mult; speed=80; color='#ff8800'; shootChance=0.6; break;
        case 'tank': w=50; h=50; hp=15 * mult; speed=40; color='#00ff00'; shootChance=0.8; break;
        case 'sniper': w=30; h=40; hp=4 * mult; speed=60; color='#aa00ff'; shootChance=0.9; break;
        case 'swarm': w=15; h=15; hp=1 * mult; speed=250; color='#ffff00'; shootChance=0.1; break;
      }

      const e: any = {
        x: Math.random() * (canvas.width - w), y: -h, width: w, height: h,
        hp: Math.ceil(hp), maxHp: Math.ceil(hp), vx: (Math.random() - 0.5) * speed, vy: speed * 0.5,
        type, color, timer: 0, shootTimer: Math.random() * 2, canShoot: Math.random() < shootChance
      };
      if (type === 'swarm') {
         for(let k=0; k<5; k++) {
            gameState.current.enemies.push({ ...e, x: e.x + (Math.random()-0.5)*50, y: e.y - (Math.random()*50), vx: (Math.random() - 0.5) * 300 });
         }
      } else {
         gameState.current.enemies.push(e);
      }
    };

    // --- GAME LOOP ---
    const gameLoop = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      frameCount++;

      if (!ctx || pausedRef.current) { animationFrameId = requestAnimationFrame(gameLoop); return; }

      // Update UI Score less frequently to save perf
      if (frameCount % 10 === 0) {
          setScore(gameState.current.gameScore);
      }

      const isOverdrive = gameState.current.overdriveTimer > 0;
      const timeWarpFactor = (isOverdrive && ship.id === 'phantom') ? 0.2 : 1.0;
      const state = gameState.current;
      const player = playerRef.current;
      const middleLine = canvas.height / 2;

      // --- SCREEN SHAKE LOGIC ---
      if (state.shake > 0) {
          ctx.save();
          // Random translation based on shake intensity
          const shakeX = (Math.random() - 0.5) * state.shake;
          const shakeY = (Math.random() - 0.5) * state.shake;
          ctx.translate(shakeX, shakeY);
          // Decay shake
          state.shake = Math.max(0, state.shake - dt * 30);
      } else ctx.save();

      // --- DRAW BACKGROUND (SYNTHWAVE GRID) ---
      ctx.fillStyle = '#050014'; // Dark Void
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Logic
      gridOffset = (gridOffset + 100 * dt * (state.boss ? 2 : 1)) % 40;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.05)'; 
      ctx.lineWidth = 1;
      
      // Vertical Lines
      for (let x = 0; x <= canvas.width; x += 40) {
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      // Horizontal Lines (Moving)
      for (let y = gridOffset; y <= canvas.height; y += 40) {
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      
      // Zone Separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([5, 15]);
      ctx.beginPath(); ctx.moveTo(0, middleLine); ctx.lineTo(canvas.width, middleLine); ctx.stroke();
      ctx.setLineDash([]);


      // --- INPUTS & UPDATE ---
      
      // Fix Infinite Health Bug
      if (player.invulnerable > 0) player.invulnerable -= dt;

      // Overdrive Input
      if (keys.current['x'] || touchInput.current.ultra) {
           if (state.overdriveValue >= 100 && !state.overdriveTimer) {
                sfx.ultimateUse();
                state.overdriveTimer = 5.0;
                addShake(15); // Shake on ult
                if (ship.id === 'striker') for(let k=0; k<10; k++) state.missiles.push({ x: player.x, y: player.y, vx: (Math.random()-0.5)*2, vy: -1, life: 5 });
           }
          touchInput.current.ultra = false;
      }
      if (state.overdriveTimer > 0) {
          state.overdriveTimer -= dt;
          if (state.overdriveTimer <= 0) { state.overdriveTimer = 0; state.overdriveValue = 0; setOverdrive(0); }
      }

      // Timers
      const activeList: PowerUpType[] = [];
      if (player.timers.rapid_fire > 0) { player.timers.rapid_fire -= dt; activeList.push('rapid_fire'); }
      if (player.timers.shield > 0) { player.timers.shield -= dt; activeList.push('shield'); }
      if (player.timers.triple_shot > 0) { player.timers.triple_shot -= dt; activeList.push('triple_shot'); }
      if (player.timers.laser > 0) { player.timers.laser -= dt; activeList.push('laser'); }
      if (player.timers.wingman > 0) { player.timers.wingman -= dt; activeList.push('wingman'); }

      // Physics (Player)
      const ACCEL = 3000 * (ship.speed / 5); const FRICTION = 0.92;
      let ax = 0, ay = 0;
      if (keys.current['ArrowUp'] || keys.current['w']) ay = -1;
      if (keys.current['ArrowDown'] || keys.current['s']) ay = 1;
      if (keys.current['ArrowLeft'] || keys.current['a']) ax = -1;
      if (keys.current['ArrowRight'] || keys.current['d']) ax = 1;
      if (touchInput.current.x !== 0) ax = touchInput.current.x;
      if (touchInput.current.y !== 0) ay = touchInput.current.y;
      if (ax !== 0 || ay !== 0) { const len = Math.sqrt(ax*ax + ay*ay); ax /= len; ay /= len; }
      player.vx += ax * ACCEL * dt; player.vy += ay * ACCEL * dt;
      player.vx *= FRICTION; player.vy *= FRICTION;
      player.x += player.vx * dt; player.y += player.vy * dt;
      
      // RESTRICT PLAYER TO GREEN ZONE (Bottom Half)
      const topBound = middleLine + 10;
      const bottomBound = canvas.height - player.height - 10;
      const leftBound = 10;
      const rightBound = canvas.width - player.width - 10;

      if (player.y < topBound) { player.y = topBound; player.vy = 0; }
      if (player.y > bottomBound) { player.y = bottomBound; player.vy = 0; }
      if (player.x < leftBound) { player.x = leftBound; player.vx = 0; }
      if (player.x > rightBound) { player.x = rightBound; player.vx = 0; }

      // Player Shooting
      if ((keys.current[' '] || touchInput.current.fire) && timestamp % (player.timers.rapid_fire > 0 ? 100 : 250) < 20) {
           sfx.shoot();
           const shoot = (ox: number, oy: number, ang: number = 0) => {
               if (player.timers.laser > 0) state.bullets.push({ x: ox, y: oy, w: 6, h: 60, vy: -1200, color: '#00ffff', type: 'laser' });
               else state.bullets.push({ x: ox, y: oy, w: 4, h: 20, vy: -800, vx: ang, color: '#00ffff', type: 'normal' });
           };
           shoot(player.x + player.width/2 - 2, player.y);
           if (player.timers.triple_shot > 0) { shoot(player.x, player.y + 10, -150); shoot(player.x + player.width, player.y + 10, 150); }
           if (player.timers.wingman > 0) { shoot(player.x - 20, player.y + 20, -50); shoot(player.x + player.width + 20, player.y + 20, 50); }
      }

      // Friendly Missiles Logic
      state.missiles.forEach((m, i) => {
         // Homing
         let target = state.enemies[0];
         if (state.boss) target = state.boss;
         // Find closest
         let minDist = 9999;
         state.enemies.forEach(e => {
             const d = Math.hypot(e.x - m.x, e.y - m.y);
             if (d < minDist) { minDist = d; target = e; }
         });

         if (target) {
             const ang = Math.atan2((target.y + target.height/2) - m.y, (target.x + target.width/2) - m.x);
             m.vx += Math.cos(ang) * 500 * dt;
             m.vy += Math.sin(ang) * 500 * dt;
         }
         m.x += m.vx * dt; m.y += m.vy * dt;
         
         // Visual
         ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI*2); ctx.fill();

         // Collision
         if (target && Math.hypot(target.x - m.x, target.y - m.y) < 30) {
             state.missiles.splice(i, 1);
             target.hp -= 5;
             createExplosion(m.x, m.y, '#ffff00', 0.5);
             if (target.hp <= 0 && target !== state.boss) {
                 state.enemies = state.enemies.filter(e => e !== target);
                 spawnFloatingText(target.x, target.y, "DESTROYED", "#fff");
             }
         }
      });

      // Spawning
      if (!state.boss) {
        state.enemySpawnTimer += dt;
        if (state.enemySpawnTimer > Math.max(0.5, 2.0 - (wave * 0.1))) { spawnEnemy(); state.enemySpawnTimer = 0; }
      }

      // --- LOGIC UPDATES ---
      // Bullets
      state.bullets.forEach((b, i) => { b.x += (b.vx||0)*dt; b.y += b.vy*dt; if (b.y < -50) state.bullets.splice(i, 1); });
      
      // Enemies
      state.enemies.forEach((e, i) => {
          // AI Movement
          if(e.type==='sniper') { e.vx = (player.x - e.x); e.y += Math.sin(timestamp/500)*0.5; }
          e.x += e.vx * dt * timeWarpFactor; e.y += e.vy * dt * timeWarpFactor;
          if (e.x <= 0 || e.x >= canvas.width - e.width) e.vx *= -1;
          
          // ZONE BOUNDARIES
          // 1. Prevent Top Exit (Don't let them disappear up)
          if (e.y < 0) { 
              e.y = 0; 
              e.vy = Math.abs(e.vy); // Bounce Down
          }

          // 2. Prevent Bottom Breach (Bounce off Middle)
          if (e.y + e.height > middleLine && !state.boss) {
              e.y = middleLine - e.height;
              e.vy = -Math.abs(e.vy * 0.8) - 20; 
          }

          // AI Shooting - More Aggressive
          if (e.canShoot && (e.shootTimer+=dt*timeWarpFactor) > (e.type === 'sniper' ? 2.5 : 1.5)) {
             e.shootTimer = 0;
             const bx = e.x+e.width/2, by = e.y+e.height;
             
             // Visual Flash on shoot
             ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI*2); ctx.fill();

             if(e.type==='sniper') {
                 const ang = Math.atan2((player.y+20)-by, (player.x+20)-bx);
                 state.enemyBullets.push({x:bx, y:by, vx:Math.cos(ang)*500, vy:Math.sin(ang)*500, w:6, h:20, color:'#ff00ff', dmg:2, type: 'sniper'});
             } else if (e.type === 'tank') {
                 // Spread shot
                 state.enemyBullets.push({x:bx, y:by, vx:-50, vy:200, w:8, h:12, color:'#00ff00', dmg:2, type: 'normal'});
                 state.enemyBullets.push({x:bx, y:by, vx:50, vy:200, w:8, h:12, color:'#00ff00', dmg:2, type: 'normal'});
             } else {
                 state.enemyBullets.push({x:bx, y:by, vx:0, vy:300, w:5, h:10, color:'#ff00aa', dmg:1, type: 'normal'});
             }
          }

          // Collision Player
          if (player.invulnerable <= 0 && player.timers.shield <= 0 && 
              e.x < player.x+player.width && e.x+e.width > player.x && e.y < player.y+player.height && e.y+e.height > player.y) {
              setHearts(h => { if(h-1<=0) { sfx.gameOver(); onGameOver({score:state.gameScore, scrapCollected:state.gameScrap, survivedWaves:wave, xpGained:state.gameXp}); } return h-1; });
              player.invulnerable = 2; 
              createExplosion(player.x, player.y, '#00ffff'); 
              addShake(10); // Shake on hit
              state.enemies.splice(i,1);
          }

          // Collision Bullets (Player shoots Enemy)
          state.bullets.forEach((b, j) => {
             if (b.x < e.x+e.width && b.x+b.w > e.x && b.y < e.y+e.height && b.y+b.h > e.y) {
                 // Damage Calculation
                 const isCrit = Math.random() < 0.15; // 15% crit chance
                 const baseDmg = (player.weaponLevel + (activeList.includes('triple_shot')?0:1));
                 const damage = isCrit ? baseDmg * 2 : baseDmg;

                 e.hp -= damage;
                 
                 // Remove bullet unless laser
                 if(b.type!=='laser') state.bullets.splice(j,1);
                 
                 // Floating Damage Text
                 spawnFloatingText(
                     e.x + e.width/2, 
                     e.y, 
                     damage.toFixed(0), 
                     isCrit ? '#ffff00' : '#ffffff', 
                     isCrit ? 24 : 14
                 );

                 if (e.hp <= 0) { 
                     createExplosion(e.x+e.width/2, e.y+e.height/2, e.color);
                     state.gameScore += 100 * state.currentCombo;
                     state.enemies.splice(i,1);
                     if(Math.random()<0.1) spawnPowerUp(e.x, e.y);
                     state.waveKillCount++;
                     state.overdriveValue = Math.min(100, state.overdriveValue + 2.5);
                     setOverdrive(state.overdriveValue);
                     if(state.waveKillCount >= KILLS_TO_ADVANCE && !state.boss) {
                         if (wave % 5 === 0) spawnBoss(); else { setWave(w=>w+1); state.waveKillCount=0; spawnFloatingText(canvas.width/2 - 50, canvas.height/2, "WAVE CLEARED", "#00ff00", 30); }
                     }
                 }
             }
          });
      });

      // Enemy Bullets
      state.enemyBullets.forEach((eb, i) => {
          eb.x += eb.vx * dt * timeWarpFactor; eb.y += eb.vy * dt * timeWarpFactor;
          // Player hit by bullet
          if (player.invulnerable<=0 && player.timers.shield<=0 && eb.x<player.x+player.width && eb.x+eb.w>player.x && eb.y<player.y+player.height && eb.y+eb.h>player.y) {
              setHearts(h => { if(h-1<=0) { sfx.gameOver(); onGameOver({score:state.gameScore, scrapCollected:state.gameScrap, survivedWaves:wave, xpGained:state.gameXp}); } return h-1; });
              player.invulnerable=2; 
              addShake(5);
              createExplosion(player.x, player.y, '#ff0000'); 
              state.enemyBullets.splice(i,1);
          }
          if (eb.y>canvas.height || eb.y<-50) state.enemyBullets.splice(i,1);
      });

      // Boss
      if (state.boss) {
         state.boss.x += state.boss.vx * dt * timeWarpFactor;
         if (state.boss.x <= 0 || state.boss.x >= canvas.width - state.boss.width) state.boss.vx *= -1;
         state.boss.timer += dt;
         if (state.boss.timer > 1.5) {
             state.boss.timer = 0;
             // Boss Shot
             for(let k=-3; k<=3; k++) state.enemyBullets.push({x:state.boss.x+60, y:state.boss.y+100, vx:k*80, vy:350, w:12, h:12, color:'#ff0000', dmg:1});
         }
         // Boss Collision
         state.bullets.forEach((b, j) => {
             if (b.x < state.boss.x+state.boss.width && b.x+b.w > state.boss.x && b.y < state.boss.y+state.boss.height && b.y+b.h > state.boss.y) {
                 const dmg = player.weaponLevel;
                 state.boss.hp -= dmg;
                 spawnFloatingText(state.boss.x + Math.random()*100, state.boss.y + 50, dmg.toString(), "#fff", 16);

                 if(b.type!=='laser') state.bullets.splice(j,1);
                 setBossHp({current:state.boss.hp, max:state.boss.maxHp});
                 if (state.boss.hp <= 0) {
                     createExplosion(state.boss.x+60, state.boss.y+50, '#fff', 5);
                     addShake(30); // Big shake on boss death
                     setBossActive(false); state.boss = null; setWave(w=>w+1); state.waveKillCount=0;
                 }
             }
         });
      }


      // --- RENDER OBJECTS ---
      
      // Draw Player
      if (player.invulnerable <= 0 || Math.floor(timestamp/100)%2===0) {
          drawVectorShip(player.x, player.y, player.width, player.height, '#00f3ff', 'player');
          if (player.timers.shield > 0) {
              ctx.strokeStyle = '#00f3ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(player.x+20, player.y+20, 35, 0, Math.PI*2); ctx.stroke();
          }
      }

      // Draw Enemies
      state.enemies.forEach(e => {
          drawVectorShip(e.x, e.y, e.width, e.height, e.color, e.type);
      });

      // Draw Boss
      if (state.boss) {
          ctx.save();
          ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
          ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4;
          ctx.strokeRect(state.boss.x, state.boss.y, state.boss.width, state.boss.height);
          // Boss Core
          ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(Math.sin(timestamp/200))})`;
          ctx.fillRect(state.boss.x+20, state.boss.y+20, state.boss.width-40, state.boss.height-40);
          ctx.restore();
      }

      // Bullets
      state.bullets.forEach(b => {
          ctx.shadowBlur = 10; ctx.shadowColor = b.color;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
      });
      state.enemyBullets.forEach(b => {
          ctx.shadowBlur = 10; ctx.shadowColor = b.color;
          ctx.fillStyle = b.color;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.w/2, 0, Math.PI*2); ctx.fill();
      });

      // Powerups (10 Types with Symbols)
      state.powerups.forEach((p, i) => {
          p.y += p.vy * dt;
          
          let color = '#00ff00';
          let symbol = '?';
          
          switch(p.type) {
              case 'health': symbol = '+'; color='#ff0000'; break;
              case 'triple_shot': symbol = '3x'; color='#ffff00'; break;
              case 'rapid_fire': symbol = 'RF'; color='#00ffff'; break;
              case 'shield': symbol = 'S'; color='#0000ff'; break;
              case 'missile': symbol = 'M'; color='#ffa500'; break;
              case 'laser': symbol = 'L'; color='#ff00ff'; break;
              case 'nuke': symbol = '☢'; color='#ff0000'; break;
              case 'wingman': symbol = 'W'; color='#00ff00'; break;
              case 'kamikaze_drones': symbol = 'D'; color='#aaaaaa'; break;
              case 'battery': symbol = '⚡'; color='#ffff00'; break;
          }

          drawGlowCircle(p.x, p.y, 12, color);
          ctx.fillStyle = '#fff'; ctx.font='bold 10px Arial'; ctx.textAlign='center'; ctx.fillText(symbol, p.x, p.y+4);

          if (Math.hypot(player.x+20-p.x, player.y+20-p.y) < 30) {
              sfx.powerup(); 
              
              // Apply Effect
              if(p.type==='health') setHearts(h=>Math.min(ship.health+2, h+1));
              else if(p.type === 'nuke') {
                  state.enemies = []; // Kill all normal enemies
                  createExplosion(canvas.width/2, canvas.height/2, '#fff', 5);
                  addShake(20);
                  spawnFloatingText(player.x, player.y, "NUKE!", "#ff0000", 30);
              }
              else if(p.type === 'battery') {
                  state.overdriveValue = 100;
                  setOverdrive(100);
                  spawnFloatingText(player.x, player.y, "MAX POWER", "#ffff00", 20);
              }
              else if(p.type === 'kamikaze_drones') {
                   for(let k=0; k<5; k++) state.missiles.push({ x: player.x, y: player.y, vx: (Math.random()-0.5)*200, vy: -300, life: 5 });
              }
              else player.timers[p.type as keyof typeof player.timers] = 10;
              
              if(p.type !== 'nuke' && p.type !== 'battery') spawnFloatingText(player.x, player.y, p.type.toUpperCase().replace('_', ' '), '#00ff00');
              
              state.powerups.splice(i,1);
          }
      });
      
      // Floating Text
      state.floatingTexts.forEach((t, i) => {
          ctx.fillStyle = t.color; 
          ctx.font = `bold ${t.size}px Orbitron`; 
          ctx.fillText(t.text, t.x, t.y); 
          t.y += t.vy * dt; 
          t.life -= dt;
          if(t.life <= 0) state.floatingTexts.splice(i, 1);
      });
      
      // Particles
      state.particles.forEach((p, i) => {
          ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if(p.life <= 0) state.particles.splice(i, 1);
      });
      ctx.globalAlpha = 1;

      ctx.restore();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPaused(p => !p); keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);

    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('resize', resizeCanvas); cancelAnimationFrame(animationFrameId); };
  }, [ship, inventory, wave]);

  const setMove = (x: number, y: number) => { touchInput.current.x = x; touchInput.current.y = y; };
  const setAction = (action: 'fire' | 'dash' | 'ultra', val: boolean) => { touchInput.current[action] = val; };

  return (
    <div className="relative w-full h-full bg-[#050014] overflow-hidden font-display select-none">
      
      {/* --- TACTICAL ZONES (RED/GREEN OVERLAYS) --- */}
      {/* ADJUSTED FOR MOBILE & DESKTOP: Use flex column for portrait/desktop, but adjust specifically for landscape mobile if needed */}
      <div className="absolute inset-2 md:inset-4 pointer-events-none z-10 flex flex-col gap-1 md:gap-2 opacity-80">
        
        {/* Enemy Zone (Top Half) */}
        <div className="flex-1 border-2 border-orange-500 rounded-t-lg shadow-[0_0_20px_rgba(249,115,22,0.2)] relative box-border">
            <div className="absolute top-2 left-2 flex gap-1">
                 <div className="w-8 h-2 bg-orange-500/50 skew-x-12"></div>
                 <div className="w-4 h-2 bg-orange-500/50 skew-x-12"></div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-2">
                <ShieldAlert size={14} className="text-orange-500 animate-pulse"/>
                <span className="text-orange-500 text-[10px] font-bold tracking-widest">ENEMY SECTOR</span>
            </div>
        </div>

        {/* Player Zone (Bottom Half) */}
        <div className="flex-1 border-2 border-green-500 rounded-b-lg shadow-[0_0_20px_rgba(34,197,94,0.2)] relative box-border">
             <div className="absolute bottom-2 right-2 flex gap-1">
                 <div className="w-8 h-2 bg-green-500/50 skew-x-12"></div>
                 <div className="w-4 h-2 bg-green-500/50 skew-x-12"></div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <Crosshair size={14} className="text-green-500"/>
                <span className="text-green-500 text-[10px] font-bold tracking-widest">PILOT SECTOR</span>
            </div>
        </div>
      </div>

      {/* --- HUD --- */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none landscape:scale-75 landscape:origin-top-left">
          <h2 className="text-neon-cyan text-3xl md:text-4xl font-bold tracking-widest drop-shadow-md">{score.toString().padStart(6, '0')}</h2>
          <p className="text-pink-500 text-xs md:text-sm tracking-widest animate-pulse font-mono">WAVE {wave}</p>
          
          <div className="mt-2 w-24 md:w-32 h-2 bg-gray-900 border border-gray-600 rounded skew-x-[-15deg]">
             <div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300" style={{ width: `${overdrive}%` }}></div>
          </div>
          <p className="text-[9px] text-yellow-400 mt-1 uppercase tracking-wider">Overdrive</p>
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-none flex flex-col items-end landscape:scale-75 landscape:origin-top-right">
           <div className="flex gap-1 mb-2">
             {Array.from({ length: Math.max(0, hearts) }).map((_, i) => (
                 <div key={i} className="w-3 md:w-4 h-5 md:h-6 bg-pink-500 skew-x-[-10deg] border border-pink-300 shadow-[0_0_5px_#ff00ff]"></div>
             ))}
           </div>
           <button className="pointer-events-auto text-cyan-500 hover:text-white transition-transform active:scale-95" onClick={() => setIsPaused(true)}><Pause size={24} /></button>
      </div>

      {bossActive && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1/3 z-20">
              <div className="text-center text-red-500 font-bold tracking-[0.3em] animate-pulse text-xs mb-1">BOSS ENTITY DETECTED</div>
              <div className="w-full h-3 bg-gray-900 border border-red-500 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 shadow-[0_0_10px_#ff0000]" style={{ width: `${(bossHp.current / bossHp.max) * 100}%` }}></div>
              </div>
          </div>
      )}

      {/* PAUSE MENU */}
      {isPaused && (
          <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 font-black italic mb-8 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">PAUSED</h2>
              <button onClick={() => setIsPaused(false)} className="w-48 py-3 bg-cyan-600 text-white font-bold skew-x-[-10deg] hover:scale-110 transition-transform mb-4 border-l-4 border-white">RESUME</button>
              <button onClick={() => onGameOver({ score: gameState.current.gameScore, scrapCollected: gameState.current.gameScrap, survivedWaves: wave, xpGained: gameState.current.gameXp })} className="w-48 py-3 border border-pink-500 text-pink-500 font-bold skew-x-[-10deg] hover:bg-pink-500 hover:text-white transition-colors">ABORT MISSION</button>
          </div>
      )}

      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* --- EXCLUSIVE MOBILE CONTROLS --- */}
      
      {/* 1. Mobile Landscape Controls (D-Pad Left, Actions Right) */}
      <div className="hidden landscape:md:hidden landscape:flex absolute inset-0 pointer-events-none z-30 justify-between items-end p-4">
          {/* Left D-Pad */}
          <div className="relative w-24 h-24 grid grid-cols-3 grid-rows-3 pointer-events-auto opacity-60">
             <div></div>
             <button className="bg-cyan-900/50 border border-cyan-500 rounded-t-lg active:bg-cyan-500" onTouchStart={() => setMove(0, -1)} onTouchEnd={() => setMove(0, 0)}><ChevronUp className="mx-auto text-white"/></button>
             <div></div>
             <button className="bg-cyan-900/50 border border-cyan-500 rounded-l-lg active:bg-cyan-500" onTouchStart={() => setMove(-1, 0)} onTouchEnd={() => setMove(0, 0)}><ChevronLeft className="mx-auto text-white"/></button>
             <div className="bg-cyan-500/20 rounded-full"></div>
             <button className="bg-cyan-900/50 border border-cyan-500 rounded-r-lg active:bg-cyan-500" onTouchStart={() => setMove(1, 0)} onTouchEnd={() => setMove(0, 0)}><ChevronRight className="mx-auto text-white"/></button>
             <div></div>
             <button className="bg-cyan-900/50 border border-cyan-500 rounded-b-lg active:bg-cyan-500" onTouchStart={() => setMove(0, 1)} onTouchEnd={() => setMove(0, 0)}><ChevronDown className="mx-auto text-white"/></button>
             <div></div>
          </div>

          {/* Right Actions */}
          <div className="flex gap-4 items-end pointer-events-auto opacity-80 mb-2">
             <button className={`w-12 h-12 rounded-full border-2 ${overdrive>=100?'border-yellow-400 bg-yellow-400 text-black animate-pulse':'border-gray-600 bg-black/50 text-gray-400'} font-bold text-[10px]`} onTouchStart={() => setAction('ultra', true)}>ULT</button>
             <button className="w-16 h-16 rounded-full border-4 border-pink-500 bg-pink-900/50 active:bg-pink-500 active:scale-95 transition-all text-white font-bold tracking-widest shadow-[0_0_15px_#ec4899]" onTouchStart={() => setAction('fire', true)} onTouchEnd={() => setAction('fire', false)}>FIRE</button>
          </div>
      </div>

      {/* 2. Mobile Portrait Controls (Bottom Panel Interface) */}
      <div className="hidden portrait:flex absolute bottom-0 left-0 w-full h-[25%] bg-[#0f0518] border-t-4 border-cyan-500 z-30 pointer-events-auto p-4 gap-4 items-center justify-between shadow-[0_-5px_20px_rgba(0,243,255,0.3)]">
          {/* Portrait D-Pad */}
          <div className="w-32 h-32 grid grid-cols-3 grid-rows-3 gap-1">
             <div></div>
             <button className="bg-cyan-900 border border-cyan-500 rounded active:bg-cyan-500 transition-colors" onTouchStart={() => setMove(0, -1)} onTouchEnd={() => setMove(0, 0)}><ChevronUp size={20} className="mx-auto text-white"/></button>
             <div></div>
             <button className="bg-cyan-900 border border-cyan-500 rounded active:bg-cyan-500 transition-colors" onTouchStart={() => setMove(-1, 0)} onTouchEnd={() => setMove(0, 0)}><ChevronLeft size={20} className="mx-auto text-white"/></button>
             <div className="flex items-center justify-center"><div className="w-2 h-2 bg-cyan-500 rounded-full"></div></div>
             <button className="bg-cyan-900 border border-cyan-500 rounded active:bg-cyan-500 transition-colors" onTouchStart={() => setMove(1, 0)} onTouchEnd={() => setMove(0, 0)}><ChevronRight size={20} className="mx-auto text-white"/></button>
             <div></div>
             <button className="bg-cyan-900 border border-cyan-500 rounded active:bg-cyan-500 transition-colors" onTouchStart={() => setMove(0, 1)} onTouchEnd={() => setMove(0, 0)}><ChevronDown size={20} className="mx-auto text-white"/></button>
             <div></div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2">
             <div className="text-cyan-500 text-[10px] tracking-[0.2em] animate-pulse">SYSTEM ONLINE</div>
             <div className="w-full h-1 bg-gray-800"><div className="h-full bg-cyan-500 w-[80%] animate-[pulse_2s_infinite]"></div></div>
          </div>

          {/* Portrait Actions */}
          <div className="flex flex-col gap-3">
             <button className="w-20 h-20 rounded-full border-4 border-pink-500 bg-pink-900 shadow-[0_0_10px_#ec4899] active:scale-95 transition-transform flex items-center justify-center" onTouchStart={() => setAction('fire', true)} onTouchEnd={() => setAction('fire', false)}>
                 <span className="font-black text-white text-sm">FIRE</span>
             </button>
             <button className={`w-12 h-12 rounded border-2 ${overdrive>=100?'border-yellow-400 bg-yellow-900 text-yellow-400':'border-gray-700 bg-gray-900 text-gray-500'} font-bold text-[10px]`} onTouchStart={() => setAction('ultra', true)}>ULTRA</button>
          </div>
      </div>

       <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-cyan-500/50 text-xs font-bold tracking-[0.5em] z-10">
        SYSTEM READY // WASD MOVE // SPACE FIRE
      </div>
    </div>
  );
};