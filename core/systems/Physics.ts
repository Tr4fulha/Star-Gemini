
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
    // Se o jogador estiver entrando (abaixo da tela), ele se move automaticamente para cima
    if (player.y > height - 100) {
         // Velocidade de entrada constante
         player.y -= 400 * dt * scale;
         
         // Zera velocidades para não acumular inércia durante a entrada
         player.vx = 0;
         player.vy = 0;
         
         // Centraliza X suavemente durante a entrada
         const targetX = width / 2 - player.width / 2;
         player.x += (targetX - player.x) * 5 * dt;
         
         return; // Retorna cedo para bloquear controle do jogador
    }

    // --- NOVA FÍSICA ---
    
    // Configurações Base
    const BASE_ACCEL = 2500; // Força do motor (menor que antes para dar "peso")
    const FRICTION = 6.0;    // Resistência do "ar/espaço" (quanto maior, mais rápido para)
    const BASE_MAX_SPEED = 500; // Velocidade máxima em pixels por segundo

    // Multiplicadores baseados nos atributos da nave (Speed 1-10)
    // Uma nave speed 5 terá comportamento padrão. Speed 8 será bem mais rápida.
    const speedMult = shipConfig.speed / 5;
    
    const accelForce = BASE_ACCEL * speedMult;
    const maxVelocity = (BASE_MAX_SPEED * speedMult) * scale; // Escala com a tela

    // Entrada de Controle
    let ax = 0, ay = 0;
    if (keys['w'] || keys['ArrowUp']) ay = -1; 
    if (keys['s'] || keys['ArrowDown']) ay = 1;
    if (keys['a'] || keys['ArrowLeft']) ax = -1; 
    if (keys['d'] || keys['ArrowRight']) ax = 1;
    
    // Joystick tem prioridade e permite movimento analógico (não apenas 0 ou 1)
    if (touchInput.x !== 0 || touchInput.y !== 0) { 
        ax = touchInput.x; 
        ay = touchInput.y; 
    }
    
    // Normalizar vetor de entrada para não andar mais rápido na diagonal (se for teclado)
    if (touchInput.x === 0 && touchInput.y === 0 && ax !== 0 && ay !== 0) {
        const len = Math.sqrt(ax*ax + ay*ay);
        ax /= len;
        ay /= len;
    }

    // Aplicação de Força (Aceleração)
    player.vx += ax * accelForce * dt; 
    player.vy += ay * accelForce * dt;

    // Aplicação de Atrito (Desaceleração natural)
    // Aplicamos uma força contrária proporcional à velocidade atual
    player.vx -= player.vx * FRICTION * dt;
    player.vy -= player.vy * FRICTION * dt;

    // Limite de Velocidade (Hard Cap)
    // Isso impede que a nave fique infinitamente rápida ou incontrolável
    const currentSpeed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
    if (currentSpeed > maxVelocity) {
        const ratio = maxVelocity / currentSpeed;
        player.vx *= ratio;
        player.vy *= ratio;
    }

    // Atualiza Posição
    player.x += player.vx * dt; 
    player.y += player.vy * dt;

    // Inclinação Visual (Banking)
    // Suavizada e limitada a ~30 graus
    const targetLean = (player.vx / maxVelocity) * 0.5; // max 0.5 radianos
    player.lean += (targetLean - player.lean) * 10 * dt; // Interpolação suave
    
    // Clamping (Limites da tela)
    const margin = 20 * scale;
    // Se bater na parede, zera a velocidade naquela direção para não "grudar"
    if (player.x < margin) { player.x = margin; player.vx = 0; }
    if (player.x > width - player.width - margin) { player.x = width - player.width - margin; player.vx = 0; }
    
    // Y Clamp (Não deixa sair por cima nem por baixo, respeitando área jogável)
    if (player.y < height * 0.1) { player.y = height * 0.1; player.vy = 0; }
    if (player.y > height - player.height - margin) { player.y = height - player.height - margin; player.vy = 0; }

    if (player.hitFlash > 0) player.hitFlash -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;
    
    // Timers de powerups
    Object.keys(player.timers).forEach(k => {
        if (player.timers[k as keyof typeof player.timers] > 0) {
            player.timers[k as keyof typeof player.timers] -= dt;
        }
    });
};

export const updateScraps = (scraps: any[], player: PlayerState, dt: number, height: number, scale: number, autoMagnet: boolean = false) => {
    for (let i = 0; i < scraps.length; i++) {
        const s = scraps[i];
        if (!s.active) continue;

        const dx = (player.x + player.width/2) - s.x;
        const dy = (player.y + player.height/2) - s.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const magnetRange = autoMagnet ? 2000 : 250 * scale;
        const isAttracted = dist < magnetRange;

        if (isAttracted) {
            const force = autoMagnet ? 4500 : 3500;
            const ang = Math.atan2(dy, dx);
            const strength = force * (1 + (1 / (dist + 50)) * 200);
            
            s.vx += Math.cos(ang) * strength * dt; 
            s.vy += Math.sin(ang) * strength * dt;
            
            s.vx *= 0.90; // Amortecimento
            s.vy *= 0.90;
        } else {
            // Gravidade suave se não atraído
            s.vy += 300 * dt; 
            s.vy = Math.min(s.vy, 200); // Terminal velocity
        }
        
        s.x += s.vx * dt; 
        s.y += s.vy * dt; 

        if (s.y > height + 200 || s.y < -500) {
            s.active = false;
        }
    }
};

export const updateEntities = (gameState: GameState, dt: number, width: number, height: number, scale: number, middleLine: number) => {
    // Bullets (Player)
    for (let i = 0; i < gameState.bullets.length; i++) {
        const b = gameState.bullets[i];
        if (!b.active) continue;
        
        // Lógica Homing (Phantom)
        if (b.isHoming) {
            let closestDist = 9999;
            let target = null;
            
            for(let j=0; j<gameState.enemies.length; j++) {
                const e = gameState.enemies[j];
                if (!e.active || e.y > b.y) continue; 
                
                const dx = e.x - b.x;
                const dy = e.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < closestDist && dist < 400 * scale) { 
                    closestDist = dist;
                    target = e;
                }
            }
            
            if (target) {
                const dx = (target.x + target.width/2) - b.x;
                const targetVx = dx * 5.0; // Steering force
                b.vx = (b.vx || 0) + (targetVx - (b.vx||0)) * 5.0 * dt;
            }
        }

        b.y += b.vy * dt;
        if (b.vx) b.x += b.vx * dt;

        if (b.y < -100 || b.y > height + 100) {
            b.active = false;
        }
    }

    // Bullets (Enemy)
    for (let i = 0; i < gameState.enemyBullets.length; i++) {
        const b = gameState.enemyBullets[i];
        if (!b.active) continue;
        
        b.y += b.vy * dt;
        b.x += (b.vx || 0) * dt;

        if (b.y < -100 || b.y > height + 100 || b.x < -100 || b.x > width + 100) {
            b.active = false;
        }
    }

    // Inimigos - Movimento Orgânico
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (!e.active) continue;

        if (e.hitFlash > 0) e.hitFlash -= dt;
        
        if (e.isEntering) {
            const dist = e.targetY - e.y;
            const speed = Math.min(800 * scale, Math.abs(dist) * 3.5); 
            e.y += speed * dt * Math.sign(dist);
            
            if (Math.abs(dist) < 5) {
                e.y = e.targetY;
                e.isEntering = false;
            }
        } else {
            // Steering Orgânico (Suavização de trajetória)
            // Em vez de bater e voltar instantaneamente (vx *= -1), aplicamos uma força contrária suave
            if (e.type !== 'kamikaze' && e.type !== 'asteroid') {
                const boundaryMargin = 30 * scale;
                const steerForce = 800 * scale; 

                // Paredes laterais
                if (e.x < boundaryMargin) {
                    e.vx += steerForce * dt; // Empurra para direita
                } else if (e.x > width - e.width - boundaryMargin) {
                    e.vx -= steerForce * dt; // Empurra para esquerda
                }

                // Paredes verticais (zona de combate)
                const topMargin = 40 * scale;
                if (e.y > middleLine + 100) {
                    e.vy -= steerForce * dt;
                } else if (e.y < topMargin) {
                    e.vy += steerForce * dt;
                }
                
                // Limite de velocidade para não acumular força infinita
                const maxSpeed = 300 * scale;
                e.vx = Math.max(-maxSpeed, Math.min(maxSpeed, e.vx));
                e.vy = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed * 0.5, e.vy)); // Movimento vertical mais contido
            }

            e.x += e.vx * dt; 
            e.y += e.vy * dt;
        }

        // Culling
        if (e.y > height + 500) {
            e.active = false;
        }
    }

    // Powerups
    for (let i = 0; i < gameState.powerups.length; i++) {
        const p = gameState.powerups[i];
        if (!p.active) continue;
        p.y += p.vy * dt;
        if (p.y > height + 100) p.active = false;
    }

    // Particles
    for (let i = 0; i < gameState.particles.length; i++) {
        const p = gameState.particles[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
    }

    // Floating Texts
    for (let i = 0; i < gameState.floatingTexts.length; i++) {
        const ft = gameState.floatingTexts[i];
        if (!ft.active) continue;
        ft.y -= ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) ft.active = false;
    }

    // Stars
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
        if (Math.abs(boss.y - boss.targetY) < 2) {
            boss.y = boss.targetY;
            boss.entering = false;
        }
    } else {
        const margin = 20 * scale;
        const minX = margin;
        const maxX = width - boss.width - margin;
        
        if (maxX <= minX) {
            boss.x = (width / 2) - (boss.width / 2);
        } else {
            boss.x += boss.moveDir * 160 * dt;
            if (boss.x < minX) {
                boss.x = minX;
                boss.moveDir = 1;
            } else if (boss.x > maxX) {
                boss.x = maxX;
                boss.moveDir = -1;
            }
        }
        
        boss.y = boss.targetY + Math.sin(timestamp / 650) * (30 * scale);
    }
};
