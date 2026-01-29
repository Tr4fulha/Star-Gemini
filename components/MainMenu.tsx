import React, { useState } from 'react';
import { Screen, PlayerData } from '../types';
import { Edit2, Check } from 'lucide-react';

interface MainMenuProps {
  setScreen: (s: Screen) => void;
  isOnline: boolean;
  playerData: PlayerData;
  onNameChange: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setScreen, isOnline, playerData, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(playerData.username || 'ROOKIE');

  const handleSaveName = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim().toUpperCase());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in relative">
      {/* Player Profile Header - Onde o nome é editado */}
      <div className="absolute top-8 left-0 w-full flex justify-center">
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 px-4 py-2 rounded-lg backdrop-blur-sm hover:border-neon-cyan/50 transition-colors">
          <div className="text-xs text-gray-400 font-display mr-2">PILOT ID:</div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={12}
                className="bg-black border border-neon-cyan text-white px-2 py-1 text-sm font-bold w-32 outline-none uppercase"
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-400 hover:text-white">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold font-mono tracking-wider">{playerData.username}</span>
              <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-neon-cyan">
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

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
        <MenuButton label="HALL DA FAMA" onClick={() => setScreen('leaderboard')} disabled={!isOnline} />
        <MenuButton label="CRÉDITOS" onClick={() => setScreen('credits')} />
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-4 left-0 w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black/50 border border-gray-800 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className={`text-[10px] font-mono tracking-widest ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            SERVER: {isOnline ? 'ONLINE' : 'OFFLINE (LOCAL)'}
          </span>
        </div>
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
      <button disabled className={`${baseClasses} border-gray-900 text-gray-700 cursor-not-allowed opacity-50`}>
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