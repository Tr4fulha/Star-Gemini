import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';
import { Power } from 'lucide-react';

export const Splash: React.FC = () => {
  const { checkBootSequence } = useGame();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Carrega sons silenciosamente enquanto espera
    sfx.init();
    
    // Pequeno delay puramente visual antes de mostrar o botão
    const timer = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
      // ESTE CLIQUE É CRÍTICO:
      // Ele destrava o AudioContext do navegador e permite o som funcionar
      sfx.resume(); 
      sfx.uiClick(); // Toca um som de teste
      checkBootSequence();
  };

  return (
    <div className="fixed inset-0 bg-[#050014] z-[100] flex flex-col items-center justify-center overflow-hidden cursor-pointer" onClick={ready ? handleStart : undefined}>
      <div className="relative mb-12">
        <div className="text-[80px] md:text-[120px] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 animate-pulse relative z-10 select-none">
          TR4
        </div>
        <div className="absolute inset-0 text-[80px] md:text-[120px] font-black italic tracking-tighter text-pink-500/30 blur-lg animate-ping select-none">
          TR4
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>
      
      {!ready ? (
          <div className="flex flex-col items-center gap-4">
              <div className="h-1 w-48 bg-gray-900 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
              </div>
              <p className="text-cyan-500/50 text-[10px] tracking-[0.5em] font-display uppercase animate-pulse">
                System Initializing
              </p>
          </div>
      ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            className="group relative flex flex-col items-center gap-4 animate-fade-in"
          >
              <div className="w-20 h-20 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                  <Power size={32} className="text-cyan-400 group-hover:text-white" />
              </div>
              <div className="text-center">
                  <p className="text-white font-display font-black text-xl tracking-widest uppercase italic group-hover:text-cyan-400 transition-colors">
                      START ENGINE
                  </p>
                  <p className="text-gray-500 text-[9px] uppercase tracking-[0.3em] mt-1">
                      CLICK TO INITIALIZE
                  </p>
              </div>
          </button>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};