import React from 'react';
import { Screen, PlayerData, Upgrade } from '../types';
import { UPGRADES } from '../constants';
import { ArrowLeft, Zap, Shield, Wind, Magnet, Database } from 'lucide-react';

interface ShopProps {
  playerData: PlayerData;
  buyUpgrade: (u: Upgrade) => void;
  goBack: () => void;
}

export const Shop: React.FC<ShopProps> = ({ playerData, buyUpgrade, goBack }) => {
  
  const getIcon = (icon: string) => {
      switch(icon) {
          case 'shield': return <Shield className="text-cyan-400" size={32}/>;
          case 'flame': return <Zap className="text-yellow-400" size={32}/>;
          case 'magnet': return <Magnet className="text-purple-400" size={32}/>;
          case 'wind': return <Wind className="text-blue-400" size={32}/>;
          case 'database': return <Database className="text-green-400" size={32}/>;
          default: return <Zap />;
      }
  }

  return (
    <div className="w-full h-full bg-[#050014] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 retro-grid opacity-20"></div>
      
      <div className="z-10 w-full max-w-5xl h-[90%] bg-glass border border-cyan-500/30 rounded-xl p-8 flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        
        <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <div>
            <h2 className="text-5xl font-black italic text-white font-display">ARMORY</h2>
            <p className="text-cyan-500 tracking-widest text-xs mt-1">UPGRADE SYSTEMS</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-pink-500 tracking-widest mb-1">CREDITS AVAILABLE</p>
            <p className="text-4xl font-display text-white drop-shadow-[0_0_5px_#fff]">
              {playerData.scrap.toLocaleString()}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2 custom-scrollbar">
          {UPGRADES.map(upgrade => {
            const isOwned = playerData.inventory.includes(upgrade.id);
            const canAfford = playerData.scrap >= upgrade.cost;

            return (
              <div 
                key={upgrade.id} 
                className={`
                    relative p-6 border rounded-lg transition-all duration-300 group
                    ${isOwned 
                        ? 'bg-cyan-900/20 border-cyan-500/50' 
                        : 'bg-black/40 border-gray-700 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]'}
                `}
              >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-black/50 rounded-lg border border-gray-600 group-hover:border-white transition-colors">
                        {getIcon(upgrade.icon)}
                    </div>
                    {isOwned && <span className="text-xs font-bold bg-cyan-500 text-black px-2 py-1 rounded">INSTALLED</span>}
                </div>

                <h3 className={`font-bold text-xl font-display mb-2 ${isOwned ? 'text-cyan-400' : 'text-white'}`}>
                  {upgrade.name}
                </h3>
                <p className="text-gray-400 text-sm mb-6 h-10 leading-tight">{upgrade.description}</p>
                
                {!isOwned && (
                    <button 
                      onClick={() => buyUpgrade(upgrade)}
                      disabled={!canAfford}
                      className={`
                        w-full py-3 font-bold tracking-widest skew-x-[-5deg] transition-all
                        ${canAfford 
                          ? 'bg-pink-600 text-white hover:bg-pink-500 hover:scale-105 shadow-[0_0_15px_#db2777]' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                      `}
                    >
                      BUY {upgrade.cost}
                    </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
          <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform"/>
            <span className="font-bold tracking-widest">RETURN TO MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};