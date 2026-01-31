
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';
import { Move, Crosshair, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

export const Tutorial: React.FC = () => {
  const { completeTutorial, playerData } = useGame();
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = TRANSLATIONS[playerData.language].tutorial;

  // Detecção simples de dispositivo
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Background estático
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Desenha grid
      ctx.fillStyle = '#050014';
      ctx.fillRect(0,0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
      for(let i=0; i<canvas.width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); }
      for(let i=0; i<canvas.height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); }
      ctx.stroke();

      // Nave do Jogador (Estática no centro)
      const cx = canvas.width/2;
      const cy = canvas.height/2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(15, 15); ctx.lineTo(0, 5); ctx.lineTo(-15, 15);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

  }, []);

  // Listeners para avançar etapas
  useEffect(() => {
      const handleInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
          if (step === 1) {
              // Etapa 1: Movimento
              if (e instanceof KeyboardEvent) {
                  if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                      sfx.uiClick();
                      setStep(2);
                  }
              } else if (e instanceof TouchEvent) {
                  const t = e.touches[0];
                  if (t.clientX < window.innerWidth / 2) { // Toque na esquerda
                      sfx.uiClick();
                      setStep(2);
                  }
              }
          } else if (step === 2) {
              // Etapa 2: Tiro
              if (e instanceof KeyboardEvent) {
                  if (e.key === ' ') {
                      sfx.shoot();
                      setStep(3);
                  }
              } else if (e instanceof TouchEvent || e instanceof MouseEvent) {
                  // Toque na direita ou clique
                  // @ts-ignore
                  const clientX = e.clientX || e.touches[0].clientX;
                  if (clientX > window.innerWidth / 2) {
                       sfx.shoot();
                       setStep(3);
                  }
              }
          }
      };

      window.addEventListener('keydown', handleInput);
      window.addEventListener('touchstart', handleInput);
      window.addEventListener('mousedown', handleInput);

      return () => {
          window.removeEventListener('keydown', handleInput);
          window.removeEventListener('touchstart', handleInput);
          window.removeEventListener('mousedown', handleInput);
      }
  }, [step]);

  const nextStep = () => {
      sfx.uiClick();
      if (step < 3) setStep(s => s + 1);
      else completeTutorial();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050014] text-white overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* OVERLAYS DAS FASES */}

      {/* STEP 0: WELCOME */}
      {step === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="text-center p-8 border border-cyan-500/50 rounded-xl bg-[#0a0610] max-w-md mx-4 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                  <h1 className="text-4xl font-display font-black italic text-cyan-400 mb-4 tracking-widest uppercase">{t.welcome_title}</h1>
                  <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                      {t.welcome_text}
                  </p>
                  <button onClick={nextStep} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 uppercase tracking-widest rounded transition-all">
                      {t.start_cal}
                  </button>
              </div>
          </div>
      )}

      {/* STEP 1: MOVEMENT */}
      {step === 1 && (
          <div className="absolute inset-0">
              <div className="absolute top-1/4 w-full text-center pointer-events-none">
                  <h2 className="text-3xl font-display font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_cyan]">{t.nav_title}</h2>
                  <p className="text-sm font-bold bg-black/50 inline-block px-2 rounded mt-2">{t.move_msg}</p>
              </div>

              {/* PC Hints */}
              {!isMobile && (
                  <div className="absolute bottom-10 left-10 flex gap-2">
                      <KeyBtn k="A" />
                      <div className="flex flex-col gap-2">
                          <KeyBtn k="W" />
                          <KeyBtn k="S" />
                      </div>
                      <KeyBtn k="D" />
                      <div className="absolute -top-10 w-full text-center text-xs font-bold uppercase tracking-widest text-cyan-400">
                          {t.pc_move}
                      </div>
                  </div>
              )}

              {/* Mobile Hints */}
              {isMobile && (
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-cyan-500/5 border-r border-cyan-500/20 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col items-center animate-pulse">
                          <div className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-500/50 flex items-center justify-center bg-cyan-500/10 mb-4">
                               <Move size={40} className="text-cyan-400" />
                          </div>
                          <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest bg-black/50 px-2 rounded">{t.mob_move}</p>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* STEP 2: SHOOTING */}
      {step === 2 && (
          <div className="absolute inset-0">
              <div className="absolute top-1/4 w-full text-center pointer-events-none">
                  <h2 className="text-3xl font-display font-black text-pink-500 uppercase tracking-widest drop-shadow-[0_0_10px_magenta]">{t.wep_title}</h2>
                  <p className="text-sm font-bold bg-black/50 inline-block px-2 rounded mt-2">{t.fire_msg}</p>
              </div>

               {/* PC Hints */}
               {!isMobile && (
                  <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2">
                      <div className="h-12 w-48 border-2 border-pink-500 rounded bg-pink-900/20 flex items-center justify-center text-pink-400 font-bold shadow-[0_0_15px_magenta]">SPACEBAR</div>
                      <span className="text-xs tracking-widest uppercase">{t.pc_fire}</span>
                  </div>
              )}

              {/* Mobile Hints */}
              {isMobile && (
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-pink-500/5 border-l border-pink-500/20 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col items-center animate-pulse">
                          <Crosshair size={64} className="text-pink-500 mb-4" />
                          <p className="text-pink-400 font-bold text-xs uppercase tracking-widest bg-black/50 px-2 rounded">{t.mob_fire}</p>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* STEP 3: OBJECTIVES (STATIC INFO) */}
      {step === 3 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                  
                  <div className="bg-[#0f0b1a] border border-cyan-500/30 rounded-xl p-6 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mb-4 text-cyan-400">
                          <div className="w-4 h-4 bg-cyan-400 rotate-45 shadow-[0_0_10px_cyan]"></div>
                      </div>
                      <h3 className="text-xl font-display font-bold text-white mb-2">{t.objs.scrap_title}</h3>
                      <p className="text-gray-400 text-xs">{t.objs.scrap_desc}</p>
                  </div>

                  <div className="bg-[#0f0b1a] border border-yellow-500/30 rounded-xl p-6 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 text-yellow-400">
                          <Zap size={32} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-white mb-2">{t.objs.ult_title}</h3>
                      <p className="text-gray-400 text-xs">{t.objs.ult_desc}</p>
                  </div>

                  <div className="bg-[#0f0b1a] border border-red-500/30 rounded-xl p-6 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                          <div className="w-8 h-8 border-2 border-red-500 rounded-sm"></div>
                      </div>
                      <h3 className="text-xl font-display font-bold text-white mb-2">{t.objs.surv_title}</h3>
                      <p className="text-gray-400 text-xs">{t.objs.surv_desc}</p>
                  </div>

                  <div className="md:col-span-3 flex justify-center mt-4">
                      <button onClick={nextStep} className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 font-black font-display text-xl uppercase tracking-widest rounded shadow-[0_0_20px_lime] transition-transform hover:scale-105">
                          {t.ready_btn}
                      </button>
                  </div>

              </div>
          </div>
      )}
      
      {/* Botão de Skip (Sempre visível para não prender ninguém) */}
      <button onClick={completeTutorial} className="absolute top-4 right-4 text-gray-600 hover:text-white text-xs font-bold uppercase tracking-widest z-[60]">
          {t.skip}
      </button>

    </div>
  );
};

const KeyBtn = ({ k }: { k: string }) => (
    <div className="w-12 h-12 border-2 border-cyan-500 rounded bg-cyan-900/20 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_10px_cyan]">{k}</div>
);
