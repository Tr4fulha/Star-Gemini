
import { Bullet, Scrap, PowerUp, Particle, PowerUpType, FloatingText } from '../types';

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    // Glow core
    ctx.shadowBlur = 5;
    ctx.shadowColor = b.color;
    ctx.fillStyle = '#fff'; 
    
    // Ensure min width/height even if scaled down
    const w = Math.max(3, b.w);
    const h = Math.max(8, b.h);
    
    // Draw white center
    ctx.fillRect(b.x + (w/4), b.y, w/2, h);
    
    // Draw colored outer
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, w, h);
    
    ctx.restore();
};

export const drawEnemyBullet = (ctx: CanvasRenderingContext2D, eb: Bullet, scale: number) => {
    const radius = Math.max(4, 7 * scale); // Tamanho mínimo de segurança
    ctx.save();
    ctx.beginPath(); 
    ctx.arc(eb.x, eb.y, radius, 0, Math.PI*2); 
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, radius * 1.5, 0, Math.PI*2);
    ctx.fillStyle = eb.color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
};

export const drawFloatingTexts = (ctx: CanvasRenderingContext2D, texts: FloatingText[]) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    texts.forEach(ft => {
        const opacity = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = opacity;
        
        ctx.font = `bold ${ft.size}px "Rajdhani"`;
        
        // Outline para legibilidade
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.strokeText(ft.text, ft.x, ft.y);
        
        // Texto principal
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
};

export const drawScrap = (ctx: CanvasRenderingContext2D, s: Scrap, timestamp: number) => {
    ctx.save();
    ctx.translate(s.x + s.size/2, s.y + s.size/2);
    ctx.rotate(timestamp / 200 + s.x); // Rotação para efeito visual
    
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    
    // Desenha um formato de diamante/cruz em vez de quadrado simples
    ctx.beginPath();
    const sz = s.size / 2;
    ctx.moveTo(0, -sz);
    ctx.lineTo(sz, 0);
    ctx.lineTo(0, sz);
    ctx.lineTo(-sz, 0);
    ctx.closePath();
    ctx.fill();
    
    // Brilho interno
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, sz/3, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, p: PowerUp, scale: number, timestamp: number) => {
    ctx.save();
    ctx.translate(p.x + p.size/2, p.y + p.size/2);
    ctx.scale(scale, scale);
    const radius = (p.size / scale) / 1.5;
    
    // Efeito de bob (flutuar)
    const bob = Math.sin(timestamp / 300) * 3;
    ctx.translate(0, bob);
    
    // Fundo Hexagonal
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = p.color;
    ctx.stroke();

    // Glow externo
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ícones Simples desenhados
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Renderiza ícone baseado no tipo
    ctx.beginPath();
    if (p.type === 'health') {
        // Cruz
        const r = radius * 0.5;
        ctx.fillRect(-r/3, -r, r/1.5, r*2);
        ctx.fillRect(-r, -r/3, r*2, r/1.5);
    } else if (p.type === 'triple_shot') {
        // Três pontos
        ctx.arc(0, -5, 3, 0, Math.PI*2);
        ctx.arc(-6, 5, 3, 0, Math.PI*2);
        ctx.arc(6, 5, 3, 0, Math.PI*2);
        ctx.fill();
    } else if (p.type === 'shield') {
        // Escudo
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    } else if (p.type === 'rapid_fire') {
        // Raios
        ctx.moveTo(-3, -8); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.lineTo(3, 8);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    } else if (p.type === 'battery') {
        // Raio Energy
        ctx.font = "bold 16px Orbitron"; 
        ctx.fillText("E", 0, 1);
    } else if (p.type === 'nuke') {
        // Caveira/X
        ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
        ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    } else {
        // Default text
        ctx.font = "bold 12px Orbitron"; 
        ctx.fillText(p.type.substring(0,1).toUpperCase(), 0, 1);
    }
    
    ctx.restore();
};
