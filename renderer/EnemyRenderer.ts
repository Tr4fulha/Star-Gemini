
import { Enemy, BossState } from '../types';

export const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy, scale: number, timestamp: number) => {
    if (!e.active) return; // Garantia extra
    ctx.save();
    let warpScale = e.isEntering ? Math.min(1.0, (180 + e.y) / 120) : 1.0;

    ctx.translate(e.x + e.width/2, e.y + e.height/2);
    ctx.scale(scale * warpScale, scale * warpScale);

    ctx.globalCompositeOperation = 'lighter';
    const isFlashing = e.hitFlash > 0;
    const wBase = e.width / scale;
    const hBase = e.height / scale;

    // Element Aura
    if (e.element === 'ice') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
    } else if (e.element === 'fire') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4400';
    }

    if (e.type === 'fighter') {
        const rot = timestamp / 500; ctx.rotate(rot);
        ctx.strokeStyle = isFlashing ? '#fff' : e.color; 
        ctx.lineWidth = 4; ctx.beginPath();
        for(let i=0; i<3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.moveTo(0, -hBase/2); ctx.lineTo(0, hBase/2); }
        ctx.stroke();
    } else if (e.type === 'asteroid') {
        ctx.rotate(timestamp / 1000);
        ctx.strokeStyle = isFlashing ? '#fff' : '#666'; ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const r = (wBase/2) * (0.8 + Math.sin(i * 1.5) * 0.2);
            ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
        }
        ctx.closePath(); ctx.stroke();
    } else if (e.type === 'kamikaze') {
        ctx.rotate(Math.PI / 4 + timestamp/100);
        ctx.fillStyle = isFlashing ? '#fff' : 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(-wBase/2.5, -hBase/2.5, wBase/1.25, hBase/1.25);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.strokeRect(-wBase/2.5, -hBase/2.5, wBase/1.25, hBase/1.25);
    } else if (e.type === 'sniper') {
        // CORREÇÃO: Rotacionar 180 graus para apontar para o jogador (baixo)
        ctx.rotate(Math.PI); 
        ctx.strokeStyle = isFlashing ? '#fff' : e.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -hBase/2); ctx.lineTo(wBase/2, hBase/2); ctx.lineTo(0, hBase/4); ctx.lineTo(-wBase/2, hBase/2); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    } else if (e.type === 'tank') {
        ctx.fillStyle = isFlashing ? '#fff' : 'rgba(34, 197, 94, 0.2)';
        ctx.fillRect(-wBase/2, -hBase/2, wBase, hBase);
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 4; ctx.strokeRect(-wBase/2, -hBase/2, wBase, hBase);
        ctx.strokeRect(-wBase/4, -hBase/4, wBase/2, hBase/2);
    } else {
        // Scout básico
        ctx.strokeStyle = isFlashing ? '#fff' : e.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -hBase/2); ctx.lineTo(wBase/2, 0); ctx.lineTo(0, hBase/2); ctx.lineTo(-wBase/2, 0); ctx.closePath(); ctx.stroke();
    }
    
    // Icon for Element
    if (e.element === 'ice') {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
    } else if (e.element === 'fire') {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.moveTo(-3, 3); ctx.lineTo(0, -3); ctx.lineTo(3, 3); ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
};

export const drawBoss = (ctx: CanvasRenderingContext2D, b: BossState, scale: number, timestamp: number) => {
    // FIX: Se o boss não estiver ativo, NÃO desenha. Evita o corpo morto na tela.
    if (!b.active) return;

    ctx.save();
    ctx.translate(b.x + b.width/2, b.y + b.height/2);
    ctx.scale(scale, scale);
    ctx.globalCompositeOperation = 'lighter';

    const isFlashing = b.hitFlash > 0;
    const isCharging = b.chargeFlash && b.chargeFlash > 0;
    const wBase = b.width / scale;
    const hBase = b.height / scale;

    // Aura de perigo
    const auraPulse = 1 + Math.sin(timestamp / 200) * 0.1;
    ctx.strokeStyle = isCharging ? '#fff' : (b.phase === 3 ? '#ff0000' : '#ef4444');
    ctx.lineWidth = isCharging ? 8 : 2;
    ctx.beginPath(); ctx.arc(0, 0, (wBase/1.5) * auraPulse, 0, Math.PI*2); ctx.stroke();

    // Núcleo do Boss
    ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.6)' : 'rgba(15, 0, 30, 0.9)';
    ctx.fillRect(-wBase/2, -hBase/2, wBase, hBase);
    
    ctx.strokeStyle = b.phase === 3 ? '#ff00ff' : '#00f3ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(-wBase/2, -hBase/2, wBase, hBase);
    
    // Olho central
    const eyeSize = 25 + Math.sin(timestamp/100)*5;
    ctx.fillStyle = isCharging ? '#fff' : (b.phase === 3 ? '#ff0000' : '#00f3ff');
    ctx.beginPath(); ctx.arc(0, 0, eyeSize, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
};
