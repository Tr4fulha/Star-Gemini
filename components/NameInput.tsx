
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TRANSLATIONS } from '../constants';
import { sfx } from '../audioService';
import { User, ChevronRight } from 'lucide-react';

export const NameInput: React.FC = () => {
  const { updateName, setScreen, playerData } = useGame();
  const [name, setName] = useState('');
  const t = TRANSLATIONS[playerData.language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      sfx.uiClick();
      updateName(name.trim().toUpperCase());
      // Após definir o nome, vai para o tutorial
      setScreen('tutorial');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050014] flex items-center justify-center p-4">
      <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none"></div>
      
      <div className="relative w-full max-w-md">
         {/* Decorative Frame */}
         <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-30"></div>
         
         <div className="relative bg-[#0a0610] border border-cyan-500/50 p-8 rounded-lg shadow-2xl">
            <div className="text-center mb-8">
               <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-widest mb-2">
                 {t.enter_name_title}
               </h1>
               <p className="text-cyan-500 text-xs font-bold tracking-[0.2em] uppercase">
                 {t.enter_name_sub}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      maxLength={12}
                      className="w-full bg-[#0f0b1a] border-2 border-gray-800 text-white pl-12 pr-4 py-4 rounded font-display font-bold text-xl tracking-widest uppercase focus:border-cyan-500 focus:outline-none transition-all placeholder-gray-700"
                      placeholder="PILOT NAME"
                      autoFocus
                    />
                </div>

                <button 
                  type="submit"
                  disabled={name.trim().length === 0}
                  className={`
                    w-full py-4 font-display font-black text-xl italic uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all
                    ${name.trim().length > 0 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                  `}
                >
                    {t.confirm_pilot} <ChevronRight />
                </button>
            </form>
         </div>
      </div>
    </div>
  );
};
