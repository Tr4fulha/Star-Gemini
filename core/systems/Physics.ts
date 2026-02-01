
import { PlayerState, GameState, ShipConfig, Particle, Star, SectorType } from '../../types';

export const updatePlayerMovement = (
  player: PlayerState, 
  keys: { [key: string]: boolean }, 
  touchInput: { x: number, y: number }, 
  shipConfig: ShipConfig, 
  dt: number, 
  width: number, 
  height: number, 
  scale: number
) => {
    // --- FÍSICA ARCADE (Drift & Momentum) ---
    
    // Aceleração alta para resposta rápida
    const BASE_ACCEL = 3200 * scale; 
    
    // Fator de atrito base (para 60fps). 
    // Valores menores que 1.0 criam o efeito de deslizamento.
    const FRICTION_FACTOR = 0.92; 
    
    // Ajuste de atrito independente do frame rate: v *= friction^(dt * 60)
    const timeAdjustedFriction = Math.pow(FRICTION_FACTOR, dt * 60);

    let speedMult = shipConfig.speed / 5; 
    if (shipConfig.id === 'phantom') speedMult *= 1.2;
    // Boost de velocidade durante tiro rápido para sensação de "Overdrive"
    if (player.timers.rapid_fire > 0) speedMult *= 1.1; 

    const accelForce = BASE_ACCEL * speedMult;

    // 1. Processar Input
    let ax = 0, ay = 0;
    if (keys['w'] || keys['ArrowUp']) ay = -1; 
    if (keys['s'] || keys['ArrowDown']) ay = 1;
    if (keys['a'] || keys['ArrowLeft']) ax = -1; 
    if (keys['d'] || keys['ArrowRight']) ax = 1;
    
    if (touchInput.x !== 0 || touchInput.y !== 0) { 
        ax = touchInput.x; 
        ay = touchInput.y; 
    } else if (ax !== 0 && ay !== 0) {
        // Normalizar vetor do teclado para não correr mais rápido na diagonal
        const len = Math.sqrt(ax*ax + ay*ay);
        ax /= len; ay /= len;
    }

    // 2. Aplicar Aceleração
    player.vx += ax * accelForce * dt;
    player.vy += ay * accelForce * dt;

    // 3. Aplicar Atrito Multiplicativo (Drift Suave)
    player.vx *= timeAdjustedFriction;
    player.vy *= timeAdjustedFriction;

    // 4. Atualizar Posição
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // 5. Inclinação Visual (Tilt) baseada na velocidade lateral
    const targetLean = (player.vx / (1000 * scale)) * 0.5;
    player.lean += (targetLean - player.lean) * 10 * dt;

    // 6. Manter dentro da tela
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x > width - player.width) { player.x = width - player.width; player.vx = 0; }
    
    // Zona segura inferior (30% da tela para baixo)
    const topLimit = height * 0.3; 
    if (player.y < topLimit) { player.y = topLimit; player.vy = 0; }
    if (player.y > height - player.height) { player.y = height - player.height; player.vy = 0; }

    // Atualizar Timers
    if (player.hitFlash > 0) player.hitFlash -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;
    
    Object.keys(player.timers).forEach(k => {
        const key = k as keyof typeof player.timers;
        if (player.timers[key] > 0) player.timers[key] -= dt;
    });
};

export const updateScraps = (scraps: any[], player: PlayerState, dt: number, height: number, scale: number, autoMagnet: boolean = false) => {
    for (let i = 0; i < scraps.length; i++) {
        const s = scraps[i];
        if (!s.active) continue;

        // Gravidade leve espacial
        s.vy += 150 * dt;

        const dx = (player.x + player.width/2) - s.x;
        const dy = (player.y + player.height/2) - s.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const magnetRange = autoMagnet ? 2000 : 300 * scale;
        
        if (dist < magnetRange) {
            const force = autoMagnet ? 15 : 8; 
            // Interpolação forte em direção ao player (Imã)
            s.x += (dx / dist) * force * 60 * dt * scale;
            s.y += (dy / dist) * force * 60 * dt * scale;
        }

        s.x += s.vx * dt; 
        s.y += s.vy * dt; 

        if (s.y > height + 100) s.active = false;
    }
};

export const updateEntities = (gameState: GameState, player: PlayerState, dt: number, width: number, height: number, scale: number, middleLine: number) => {
    // --- PLAYER BULLETS ---
    for (let i = 0; i < gameState.bullets.length; i++) {
        const b = gameState.bullets[i];
        if (!b.active) continue;
        
        // Homing Logic (Phantom Skill / Mod)
        if (b.isHoming) {
            let closest = null, closeDist = 600 * scale;
            for(const e of gameState.enemies) {
                if(!e.active || e.y > b.y) continue;
                const d = Math.sqrt((e.x-b.x)**2 + (e.y-b.y)**2);
                if(d < closeDist) { closeDist = d; closest = e; }
            }
            if(closest) {
                const dx = (closest.x + closest.width/2) - b.x;
                b.vx = (b.vx || 0) + (dx * 10 * dt); 
            }
        }

        b.y += b.vy * dt;
        if (b.vx) b.x += b.vx * dt;

        if (b.y < -50 || b.y > height + 50 || b.x < -100 || b.x > width + 100) b.active = false;
    }

    // --- ENEMY BULLETS ---
    for (let i = 0; i < gameState.enemyBullets.length; i++) {
        const b = gameState.enemyBullets[i];
        if (!b.active) continue;
        
        // Homing (Mísseis Inimigos Guiados)
        if (b.isHoming) {
             const dx = (player.x + player.width/2) - b.x;
             const dy = (player.y + player.height/2) - b.y;
             const angle = Math.atan2(dy, dx);
             
             const currentVx = b.vx || 0;
             const currentVy = b.vy;
             const turnSpeed = 5 * dt;
             
             b.vx = currentVx * (1 - turnSpeed) + Math.cos(angle) * 300 * scale * turnSpeed;
             b.vy = currentVy * (1 - turnSpeed) + Math.sin(angle) * 300 * scale * turnSpeed;
        }

        b.y += b.vy * dt;
        b.x += (b.vx || 0) * dt;

        if (b.y < -100 || b.y > height + 100 || b.x < -100 || b.x > width + 100) b.active = false;
    }

    // --- INIMIGOS (IA SENOIDAL / ORGÂNICA) ---
    const playerCx = player.x + player.width/2;
    const combatZoneBottom = height * 0.6; // Zona onde inimigos flutuam

    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (!e.active) continue;
        if (e.hitFlash > 0) e.hitFlash -= dt;

        // Timer baseado no tempo absoluto para sincronia de onda perfeita
        const timeFactor = Date.now() / 1000;

        if (e.isEntering) {
            // Entrada rápida
            e.y += 400 * dt * scale;
            if (e.y >= 50 * scale) e.isEntering = false;
        } else {
            // Behavioral Logic
            let speed = 200 * scale; 

            if (e.type === 'scout') {
                // SINE WAVE (Padrão Clássico)
                // Movimento vertical em onda + Movimento horizontal amplo
                e.y += Math.sin(timeFactor * 3) * (speed * 0.5) * dt; 
                e.x += Math.sin(timeFactor * 4) * (250 * scale) * dt; 
                
                // Avanço constante para baixo lento
                if(e.y < combatZoneBottom) e.y += 30 * dt;

            } else if (e.type === 'fighter') {
                // TRACKING (Persegue o X do jogador)
                const trackSpeed = 180 * scale;
                if (e.x + e.width/2 < playerCx - 10) e.x += trackSpeed * dt;
                else if (e.x + e.width/2 > playerCx + 10) e.x -= trackSpeed * dt;
                
                // Hover vertical suave
                e.y += Math.cos(timeFactor * 2) * (50 * scale) * dt;

            } else if (e.type === 'kamikaze') {
                // MERGULHO AGRESSIVO
                const dx = playerCx - (e.x + e.width/2);
                e.x += Math.sign(dx) * 300 * scale * dt;
                e.y += 600 * scale * dt; // Desce muito rápido

            } else {
                // PADRÃO (Heavy/Sniper/Tank)
                // Movimento de "Oito" lento
                e.y += Math.sin(timeFactor) * 20 * scale * dt;
                if (e.y < 100 * scale) e.y += 30 * dt;
            }

            // Clamping Lateral
            if (e.x < 0) e.x = 0;
            if (e.x > width - e.width) e.x = width - e.width;
            
            // Limite inferior (exceto Kamikaze/Asteroid que passam direto)
            if (e.type !== 'kamikaze' && e.type !== 'asteroid' && e.y > combatZoneBottom) {
                e.y = combatZoneBottom;
            }
        }

        // Remover se sair da tela
        if (e.y > height + 200) e.active = false;
    }

    // Powerups & Particles
    for (let i = 0; i < gameState.powerups.length; i++) {
        const p = gameState.powerups[i];
        if (!p.active) continue;
        p.y += p.vy * dt;
        if (p.y > height + 100) p.active = false;
    }

    for (let i = 0; i < gameState.particles.length; i++) {
        const p = gameState.particles[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
    }

    for (let i = 0; i < gameState.floatingTexts.length; i++) {
        const ft = gameState.floatingTexts[i];
        if (!ft.active) continue;
        ft.y -= ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) ft.active = false;
    }

    gameState.stars.forEach(s => {
        s.y += s.speed * dt;
        if (s.y > height) { s.y = -20; s.x = Math.random() * width; }
    });
};

export const updateBoss = (boss: any, dt: number, width: number, scale: number, timestamp: number) => {
    if (!boss.active) return;
    if (boss.hitFlash > 0) boss.hitFlash -= dt;
    
    if (boss.entering) {
        boss.y += (boss.targetY - boss.y) * 2.0 * dt;
        if (Math.abs(boss.y - boss.targetY) < 5) {
            boss.y = boss.targetY;
            boss.entering = false;
        }
    } else {
        // Padrão Lissajous (Símbolo do Infinito)
        const t = timestamp / 1000;
        
        // Movimento lateral amplo
        boss.x += Math.cos(t * 1.0) * (120 * scale) * dt;
        
        // Movimento vertical leve
        boss.y = boss.targetY + Math.sin(t * 1.5) * (40 * scale);

        // Clamping
        if (boss.x < 20) boss.x = 20;
        if (boss.x > width - boss.width - 20) boss.x = width - boss.width - 20;
    }
};
