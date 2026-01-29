import React, { useState } from 'react';
import { Screen, PlayerData } from '../types';
import { Edit2, Check, Settings, Trophy, ShoppingBag, BookOpen, Play } from 'lucide-react';

interface MainMenuProps {
  setScreen: (s: Screen) => void;
  isOnline: boolean;
  playerData: PlayerData;
  onNameChange: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setScreen, isOnline, playerData, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(playerData.username || 'PILOT');

  const handleSaveName = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim().toUpperCase());
      setIsEditing(false);
    }
  };

  const getRank = (score: number) => {
      if (score > 50000) return 'LEGEND';
      if (score > 10000) return 'VETERAN';
      return 'ROOKIE';
  }

  return (
    <div className="w-full h-full bg-[#050014] overflow-y-auto custom-scrollbar relative">
      {/* Background Grid - Fixed */}
      <div className="fixed inset-0 retro-grid opacity-20 pointer-events-none"></div>
      
      {/* Container to center content */}
      <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        
        <div className="w-full max-w-2xl flex flex-col gap-6">
            
            {/* HEADER GRAPHIC */}
            <div className="w-full aspect-[4/1] md:aspect-[5/1] bg-gradient-to-b from-cyan-300 to-blue-600 rounded-sm relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                {/* Scanlines Overlay */}
                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 3px)' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            {/* TITLE TEXT */}
            <h1 className="text-pink-500 font-display tracking-[0.2em] md:tracking-[0.4em] text-sm md:text-lg font-bold uppercase text-left">
                Hyper Arcade Shooter
            </h1>

            {/* PILOT CARD */}
            <div className="w-full bg-[#0a0610] border border-gray-800 rounded-xl p-6 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 blur-xl rounded-full"></div>
                
                {/* Header Row */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-cyan-500 text-[10px] md:text-xs font-bold tracking-widest uppercase">Pilot ID</span>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
                </div>

                {/* Main Info Row */}
                <div className="flex items-center gap-5 mb-8">
                    {/* Level/Avatar Box */}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-md shadow-lg flex items-center justify-center relative overflow-hidden border border-white/10 shrink-0">
                        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 3px)' }}></div>
                        <span className="font-display font-black text-3xl text-white drop-shadow-md z-10">{playerData.level}</span>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                             <div className="flex items-center gap-2">
                                <input 
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  className="bg-gray-900 border border-cyan-500 text-white px-3 py-1 font-display outline-none w-full uppercase"
                                  autoFocus
                                />
                                <button onClick={handleSaveName} className="text-green-500 hover:scale-110 shrink-0"><Check/></button>
                             </div>
                        ) : (
                            <div className="group/name cursor-pointer truncate" onClick={() => setIsEditing(true)}>
                                <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-wide flex items-center gap-3 truncate">
                                    {playerData.username} 
                                    <Edit2 size={16} className="text-gray-700 group-hover/name:text-cyan-500 transition-colors opacity-0 group-hover/name:opacity-100 shrink-0"/>
                                </h2>
                                <p className="text-gray-500 text-xs font-bold tracking-widest mt-1 uppercase">Rank: {getRank(playerData.highScore)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Credits */}
                    <div className="bg-[#0f0919] rounded p-4 border-l-2 border-pink-500 relative overflow-hidden">
                        <p className="text-pink-500 text-[10px] font-bold tracking-widest uppercase mb-1">Credits</p>
                        <p className="font-display text-white text-lg md:text-2xl truncate">{playerData.scrap.toLocaleString()}</p>
                    </div>
                    {/* High Score */}
                    <div className="bg-[#0f0919] rounded p-4 border-l-2 border-cyan-500 relative overflow-hidden">
                        <p className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase mb-1">High Score</p>
                        <p className="font-display text-white text-lg md:text-2xl truncate">{playerData.highScore.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* LAUNCH BUTTON */}
            <button 
                onClick={() => setScreen('ship-select')}
                className="w-full h-20 md:h-24 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-[0_5px_20px_rgba(219,39,119,0.3)] shrink-0"
            >
                {/* Texture */}
                <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)' }}></div>
                
                <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                    <Play className="fill-white w-8 h-8 md:w-10 md:h-10 drop-shadow-md" />
                    <span className="font-display font-black text-3xl md:text-4xl tracking-[0.2em] text-white drop-shadow-md">LAUNCH</span>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* SECONDARY MENU */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 mt-2">
                 <SecondaryBtn icon={<ShoppingBag size={20}/>} label="SHOP" onClick={() => setScreen('shop')} color="border-cyan-500/30 text-cyan-500" />
                 <SecondaryBtn icon={<Trophy size={20}/>} label="RANK" onClick={() => setScreen('leaderboard')} color="border-purple-500/30 text-purple-500" disabled={!isOnline} />
                 <SecondaryBtn icon={<Settings size={20}/>} label="OPTS" onClick={() => setScreen('options')} color="border-blue-500/30 text-blue-500" />
                 <SecondaryBtn icon={<BookOpen size={20}/>} label="INFO" onClick={() => setScreen('credits')} color="border-pink-500/30 text-pink-500" />
            </div>

        </div>
      </div>
    </div>
  );
};

const SecondaryBtn = ({ icon, label, onClick, color, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            h-16 md:h-20 bg-[#0a0610] border ${color} rounded-lg flex flex-col items-center justify-center gap-2
            hover:bg-white/5 active:scale-95 transition-all
            ${disabled ? 'opacity-50 grayscale' : 'hover:border-opacity-100'}
        `}
    >
        {icon}
        <span className="text-[10px] font-bold tracking-widest">{label}</span>
    </button>
);