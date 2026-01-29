import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../supabaseService';
import { Profile } from '../types';

interface LeaderboardProps {
  goBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ goBack }) => {
  const [scores, setScores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const data = await getLeaderboard();
      setScores(data);
      setLoading(false);
    };
    fetchScores();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-6 animate-fade-in">
      <h2 className="text-4xl text-neon-cyan font-black italic font-display mb-8 drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">
        HALL DA FAMA
      </h2>

      <div className="w-full bg-gray-900/80 border border-gray-700 p-1 mb-8 custom-scrollbar max-h-[60vh] overflow-y-auto">
        {loading ? (
           <div className="p-8 text-center text-gray-500 font-display animate-pulse">CARREGANDO DADOS...</div>
        ) : scores.length === 0 ? (
           <div className="p-8 text-center text-gray-500">NENHUM REGISTRO ENCONTRADO</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-xs text-gray-400 font-display">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">PILOTO</th>
                <th className="p-3 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((profile, index) => (
                <tr key={profile.id} className="border-b border-gray-800 hover:bg-white/5 font-mono text-sm">
                  <td className="p-3 text-gray-500 font-bold">{index + 1}</td>
                  <td className="p-3 text-white">
                    {/* Exibe o nome ou um ID genérico se estiver vazio */}
                    {profile.username || `PILOT-${profile.id.substring(0, 4)}`}
                  </td>
                  <td className="p-3 text-right text-neon-yellow font-bold">
                    {profile.high_score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={goBack} className="text-gray-500 hover:text-white font-bold text-sm uppercase tracking-widest border border-transparent hover:border-gray-700 px-6 py-2 transition-all">
        Voltar ao Menu
      </button>
    </div>
  );
};