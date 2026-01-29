import React from 'react';
import { Screen } from '../types';

interface MainMenuProps {
  setScreen: (s: Screen) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setScreen }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
      {/* Logo Area */}
      <div className="text-center mb-8">
        <h1 className="text-8xl font-black italic text-neon-cyan font-display drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
          SG
        </h1>
        <p className="text-gray-400 tracking-[0.5em] text-sm mt-2 font-display uppercase">
          Star Gemini Arcade
        </p>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col w-64 space-y-4">
        <MenuButton label="INICIAR MISSÃO" onClick={() => setScreen('ship-select')} primary />
        <MenuButton label="HANGAR / LOJA" onClick={() => setScreen('shop')} color="yellow" />
        <MenuButton label="OPÇÕES" onClick={() => setScreen('options')} />
        <MenuButton label="HALL DA FAMA" onClick={() => {}} disabled />
        <MenuButton label="CRÉDITOS" onClick={() => setScreen('credits')} />
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ 
  label: string; 
  onClick: () => void; 
  primary?: boolean; 
  color?: 'cyan' | 'yellow';
  disabled?: boolean;
}> = ({ label, onClick, primary, color = 'cyan', disabled }) => {
  const baseClasses = "w-full py-3 px-4 font-bold text-sm tracking-wide uppercase transition-all duration-200 border-b-2 font-display text-center relative overflow-hidden group";
  
  const colors = {
    cyan: primary 
      ? "bg-cyan-900/30 border-cyan-400 text-cyan-50 hover:bg-cyan-800/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]" 
      : "border-gray-800 text-gray-300 hover:text-white hover:border-cyan-400",
    yellow: "bg-yellow-900/20 border-yellow-600 text-yellow-500 hover:bg-yellow-900/40 hover:text-yellow-300"
  };

  const activeClass = color === 'yellow' ? colors.yellow : colors.cyan;

  if (disabled) {
    return (
      <button disabled className={`${baseClasses} border-gray-900 text-gray-700 cursor-not-allowed`}>
        {label}
      </button>
    )
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClass}`}>
      <span className="relative z-10">{label}</span>
      {/* Hover Line Effect */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 bg-${color === 'cyan' ? 'cyan-400' : 'yellow-500'} transition-all duration-300 group-hover:w-full`}></div>
    </button>
  );
};