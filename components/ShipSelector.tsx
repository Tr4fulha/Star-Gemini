import React, { useState } from 'react';
import { SHIPS } from '../constants';
import { ShipConfig } from '../types';

interface ShipSelectorProps {
  onSelect: (ship: ShipConfig) => void;
  goBack: () => void;
}

export const ShipSelector: React.FC<ShipSelectorProps> = ({ onSelect, goBack }) => {
  const [selectedId, setSelectedId] = useState<string>('core');

  const selectedShip = SHIPS.find(s => s.id === selectedId) || SHIPS[0];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto p-4 animate-fade-in">
      <h2 className="text-3xl text-neon-cyan font-display italic font-black mb-12">
        ESCOLHA SUA NAVE
      </h2>

      <div className="flex gap-4 md:gap-8 mb-12 w-full justify-center">
        {SHIPS.map(ship => {
          const isSelected = selectedId === ship.id;
          return (
            <div 
              key={ship.id}
              onClick={() => setSelectedId(ship.id)}
              className={`
                relative w-28 h-32 md:w-40 md:h-48 cursor-pointer transition-all duration-300
                border-2 flex flex-col items-center justify-center bg-black
                ${isSelected 
                  ? 'border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-110 z-10' 
                  : 'border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-600'
                }
              `}
            >
              {/* Simple CSS shapes for ships */}
              <div 
                className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[40px] mb-4 transition-colors duration-300"
                style={{ 
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: isSelected ? ship.color : '#333'
                }}
              />
              <span className={`font-display font-bold text-sm uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {ship.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-center mb-12 h-20">
         <p className="text-gray-400 max-w-md mx-auto">{selectedShip.description}</p>
         <div className="flex justify-center gap-4 mt-4 text-xs font-mono text-gray-500">
            <span>SPD: {selectedShip.speed}</span>
            <span>PWR: {selectedShip.power}</span>
            <span>HULL: {selectedShip.health}</span>
         </div>
      </div>

      <button 
        onClick={() => onSelect(selectedShip)}
        className="w-64 py-4 bg-neon-cyan text-black font-black font-display text-lg tracking-widest hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all duration-300"
      >
        LANÇAR NAVE
      </button>

      <button onClick={goBack} className="mt-8 text-gray-600 hover:text-white text-sm font-bold uppercase tracking-widest">
        Voltar
      </button>
    </div>
  );
};