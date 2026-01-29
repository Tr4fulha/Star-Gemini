import React from 'react';
import { Screen, PlayerData, Upgrade } from '../types';
import { UPGRADES } from '../constants';

interface ShopProps {
  playerData: PlayerData;
  buyUpgrade: (u: Upgrade) => void;
  goBack: () => void;
}

export const Shop: React.FC<ShopProps> = ({ playerData, buyUpgrade, goBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 h-full flex flex-col">
      <header className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-4xl italic font-black text-neon-yellow font-display">HANGAR / LOJA</h2>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">SUCATA</p>
          <p className="text-3xl font-display text-neon-yellow tracking-widest">
            {playerData.scrap.toString().padStart(6, '0')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-20 custom-scrollbar">
        {UPGRADES.map(upgrade => {
          const isOwned = playerData.inventory.includes(upgrade.id);
          const canAfford = playerData.scrap >= upgrade.cost;

          return (
            <div key={upgrade.id} className="bg-gray-900/50 border border-gray-800 p-4 flex justify-between items-center group hover:border-gray-600 transition-colors">
              <div>
                <h3 className={`font-bold text-lg ${isOwned ? 'text-green-400' : 'text-neon-cyan'}`}>
                  {upgrade.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{upgrade.description}</p>
                {isOwned && <div className="flex gap-1 mt-2">
                   <span className="w-4 h-1 bg-green-500/50"></span>
                   <span className="w-4 h-1 bg-green-500/50"></span>
                   <span className="w-4 h-1 bg-green-500/50"></span>
                </div>}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {!isOwned && (
                  <div className="text-gray-500 text-xs font-mono border border-gray-800 px-2 py-1">
                    CUSTO: {upgrade.cost}
                  </div>
                )}
                
                {isOwned ? (
                  <button disabled className="px-6 py-2 bg-gray-800 text-gray-500 font-bold text-sm cursor-default">
                    INSTALADO
                  </button>
                ) : (
                  <button 
                    onClick={() => buyUpgrade(upgrade)}
                    disabled={!canAfford}
                    className={`px-6 py-2 font-bold text-sm transition-all
                      ${canAfford 
                        ? 'bg-gray-800 text-gray-300 hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.6)]' 
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                  >
                    COMPRAR
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-8 text-center">
        <button onClick={goBack} className="text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
          Voltar
        </button>
      </div>
    </div>
  );
};