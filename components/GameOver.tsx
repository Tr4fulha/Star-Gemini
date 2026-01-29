import React from 'react';
import { GameResult } from '../types';

interface GameOverProps {
  result: GameResult;
  onRetry: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ result, onRetry, onMenu }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-red-950/20 animate-pulse-slow">
      <h1 className="text-6xl md:text-8xl font-black italic font-display text-white mb-8 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
        FALHA NA MISSÃO
      </h1>
      
      <div className="space-y-2 text-center mb-12">
        <h2 className="text-2xl text-neon-cyan font-bold">PONTOS: {result.score}</h2>
        <h3 className="text-xl text-neon-yellow font-bold">SUCATA COLLECTED: {result.scrapCollected}</h3>
        <p className="text-gray-500 text-sm">WAVES SURVIVED: {result.survivedWaves}</p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={onRetry}
          className="w-full py-4 bg-white text-black font-black font-display uppercase hover:scale-105 transition-transform"
        >
          TENTAR NOVAMENTE
        </button>
        <button 
          onClick={onMenu}
          className="text-gray-500 hover:text-white py-2 text-sm"
        >
          MENU
        </button>
      </div>
    </div>
  );
};