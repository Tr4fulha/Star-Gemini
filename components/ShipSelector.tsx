import React, { useState } from 'react';
import { SHIPS } from '../constants';
import { ShipConfig, PlayerData } from '../types';
import { Lock, ArrowRight } from 'lucide-react';

interface ShipSelectorProps {
  onSelect: (ship: ShipConfig) => void;
  goBack: () => void;
  playerData: PlayerData;
}

export const ShipSelector: React.FC<ShipSelectorProps> = ({ onSelect, goBack, playerData }) => {
  const [selectedId, setSelectedId] = useState<string>('core');

  const selectedShip = SHIPS.find(s => s.id === selectedId) || SHIPS[0];
  const maxWave = playerData.maxWave || 0;
  const isLocked = maxWave < selectedShip.unlockWave;

  return (
    <div className="w-full h-full bg-[#050014] flex flex-col md:justify-center p-0 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-6xl mx-auto flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-8 h-full md:h-[85vh] bg-[#050014] md:bg-transparent">
        
        {/* HEADER (Mobile Only) */}
        <div className="md:hidden p-4 border-b border-gray-800 bg-[#0a0610]">
            <h2 className="text-xl font-display font-black text-white italic">SELECT CRAFT</h2>
        </div>

        {/* TOP/LEFT: Ship Preview & Stats (Stacked on Mobile) */}
        <div className="md:col-span-8 order-1 md:order-2 flex flex-col relative h-[50vh] md:h-auto">
            
            {/* Holographic Ship Preview (CSS Art) */}
            <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-[#0a0610] to-transparent">
                 <div className="absolute inset-0 bg-cyan-500/5 blur-[50px] md:blur-[100px] rounded-full pointer-events-none"></div>
                 {/* Rotating Grid Floor */}
                 <div className="absolute bottom-10 md:bottom-20 w-48 md:w-64 h-16 md:h-24 border border-cyan-500/30 rounded-[100%] animate-[spin_10s_linear_infinite] [transform:rotateX(70deg)]"></div>
                 
                 <div className="relative z-10 animate-bounce transition-all duration-500">
                     {/* Simplified Neon Ship Shape */}
                     <div 
                        className={`
                            w-24 h-24 md:w-32 md:h-32 border-2 relative rotate-45 transition-colors duration-300
                            ${isLocked ? 'border-red-500 shadow-[0_0_20px_#ef4444]' : 'border-cyan-400 shadow-[0_0_30px_#06b6d4]'}
                        `}
                     >
                        <div className="absolute inset-0 border border-white/20 m-2"></div>
                     </div>
                 </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-[#0f0919] border-t border-cyan-500/30 p-6 md:p-8 backdrop-blur-xl shrink-0">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-display font-black text-white italic">{selectedShip.name}</h1>
                        <p className="text-cyan-400 text-xs md:text-sm tracking-widest mt-1 md:mt-2">{selectedShip.description}</p>
                    </div>
                    {isLocked && <div className="text-red-500 font-bold border border-red-500 px-2 py-1 md:px-4 md:py-2 rounded text-[10px] md:text-xs">LOCKED</div>}
                 </div>

                 <div className="grid grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
                    <StatBar label="SPEED" value={selectedShip.speed} max={10} color="bg-blue-500" />
                    <StatBar label="POWER" value={selectedShip.power * 5} max={10} color="bg-pink-500" />
                    <StatBar label="ARMOR" value={selectedShip.health * 2} max={10} color="bg-green-500" />
                 </div>

                 <button 
                    onClick={() => onSelect(selectedShip)}
                    disabled={isLocked}
                    className={`
                        w-full py-4 md:py-6 font-display font-black text-xl md:text-2xl tracking-widest transition-all relative overflow-hidden group
                        ${isLocked 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'}
                    `}
                 >
                    {/* Scanline Effect on Button */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)' }}></div>
                    <span className="relative z-10">{isLocked ? 'LOCKED' : 'INITIATE LAUNCH SEQUENCE'}</span>
                 </button>
            </div>
        </div>

        {/* BOTTOM/RIGHT: Ship List (Scrollable on Mobile) */}
        <div className="md:col-span-4 order-2 md:order-1 bg-[#0a0610] md:bg-glass border-t md:border-r border-cyan-500/20 p-4 md:p-6 flex flex-col gap-2 md:gap-4 overflow-y-auto h-[30vh] md:h-auto">
           <h2 className="hidden md:block text-2xl font-display font-black text-white italic mb-4">FLEET</h2>
           {SHIPS.map(ship => {
               const active = selectedId === ship.id;
               const locked = maxWave < ship.unlockWave;
               return (
                   <button 
                     key={ship.id}
                     onClick={() => setSelectedId(ship.id)}
                     className={`
                        p-3 md:p-4 text-left border-l-4 transition-all duration-300 relative group overflow-hidden shrink-0
                        ${active 
                            ? 'bg-gradient-to-r from-cyan-900/50 to-transparent border-cyan-400' 
                            : 'border-gray-700 hover:bg-white/5'}
                     `}
                   >
                      <div className="relative z-10">
                        <h3 className={`font-display font-bold text-base md:text-lg ${active ? 'text-white' : 'text-gray-400'}`}>{ship.name}</h3>
                        {locked && <div className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><Lock size={8}/> WAVE {ship.unlockWave}</div>}
                      </div>
                   </button>
               )
           })}
           <button onClick={goBack} className="mt-auto text-gray-500 hover:text-white text-xs md:text-sm py-4">BACK TO MENU</button>
        </div>

      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => (
    <div>
        <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400 mb-1 md:mb-2">
            <span>{label}</span>
            <span>{Math.round((value/max)*100)}%</span>
        </div>
        <div className="h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${color} shadow-[0_0_10px_currentColor]`} style={{ width: `${(value/max)*100}%` }}></div>
        </div>
    </div>
);