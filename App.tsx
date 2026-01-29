import React, { useState, useEffect } from 'react';
import { Screen, PlayerData, ShipConfig, Upgrade, GameResult } from './types';
import { SHIPS } from './constants';
import { getPlayerData, savePlayerData } from './supabaseService';
import { MainMenu } from './components/MainMenu';
import { Shop } from './components/Shop';
import { ShipSelector } from './components/ShipSelector';
import { GameEngine } from './components/GameEngine';
import { GameOver } from './components/GameOver';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playerData, setPlayerData] = useState<PlayerData>({ scrap: 0, highScore: 0, inventory: [] });
  const [selectedShip, setSelectedShip] = useState<ShipConfig>(SHIPS[0]);
  const [lastGameResult, setLastGameResult] = useState<GameResult | null>(null);

  // Load data on mount
  useEffect(() => {
    getPlayerData().then(setPlayerData);
  }, []);

  const handleBuyUpgrade = (upgrade: Upgrade) => {
    if (playerData.scrap >= upgrade.cost && !playerData.inventory.includes(upgrade.id)) {
      const newData = {
        ...playerData,
        scrap: playerData.scrap - upgrade.cost,
        inventory: [...playerData.inventory, upgrade.id]
      };
      setPlayerData(newData);
      savePlayerData(newData);
    }
  };

  const handleGameOver = (result: GameResult) => {
    setLastGameResult(result);
    // Update player data
    const newData = {
      ...playerData,
      scrap: playerData.scrap + result.scrapCollected,
      highScore: Math.max(playerData.highScore, result.score)
    };
    setPlayerData(newData);
    savePlayerData(newData);
    setScreen('game-over');
  };

  const handleLaunch = (ship: ShipConfig) => {
    setSelectedShip(ship);
    setScreen('game');
  };

  const renderScreen = () => {
    switch(screen) {
      case 'menu':
        return <MainMenu setScreen={setScreen} />;
      
      case 'shop':
        return (
          <Shop 
            playerData={playerData} 
            buyUpgrade={handleBuyUpgrade} 
            goBack={() => setScreen('menu')} 
          />
        );
      
      case 'ship-select':
        return (
          <ShipSelector 
            onSelect={handleLaunch} 
            goBack={() => setScreen('menu')} 
          />
        );
      
      case 'game':
        return (
          <GameEngine 
            ship={selectedShip} 
            inventory={playerData.inventory}
            onGameOver={handleGameOver} 
          />
        );

      case 'game-over':
        return (
          <GameOver 
            result={lastGameResult!} 
            onRetry={() => setScreen('ship-select')} 
            onMenu={() => setScreen('menu')} 
          />
        );

      case 'options':
        return (
           <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto p-8">
              <h2 className="text-4xl text-neon-cyan font-black italic font-display mb-12">OPÇÕES</h2>
              
              <div className="w-full space-y-8 mb-12">
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-bold uppercase">Master Volume</label>
                  <input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-bold uppercase">Music Volume</label>
                  <input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan" defaultValue="60"/>
                </div>
                 <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-bold uppercase">Language</label>
                  <div className="w-full border border-gray-700 p-3 text-center text-white font-display">PORTUGUÊS</div>
                </div>
              </div>

              <button onClick={() => setScreen('menu')} className="text-gray-500 hover:text-white font-bold text-sm">VOLTAR</button>
           </div>
        );

      case 'credits':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-12">
             <h2 className="text-4xl text-neon-cyan font-black italic font-display">CRÉDITOS</h2>
             
             <div>
               <h3 className="text-white font-bold text-xl mb-1">TR4FULHA TEAM</h3>
               <p className="text-gray-500 text-sm">Development & Design</p>
             </div>

             <div>
               <h3 className="text-white font-bold text-xl mb-1">MUSIC & SFX</h3>
               <p className="text-gray-500 text-sm">Generated / Retro Synthesis</p>
             </div>

             <button onClick={() => setScreen('menu')} className="text-gray-500 hover:text-white font-bold text-sm mt-8">VOLTAR</button>
          </div>
        )
      
      default:
        return <MainMenu setScreen={setScreen} />;
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans select-none">
      {renderScreen()}
    </div>
  );
}