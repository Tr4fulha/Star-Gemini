import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../supabaseService';
import { Profile } from '../types';
import { ArrowLeft, Trophy } from 'lucide-react';

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
    <div className="w-full h-full bg-[#050014] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 retro-grid opacity-20"></div>

      <div className="z-10 w-full max-w-4xl bg-glass border border-purple-500/30 rounded-xl p-8 flex flex-col h-[85vh] shadow-[0_0_50px_rgba(168,85,247,0.15)]">
        
        <div className="text-center mb-8">
             <Trophy className="mx-auto text-purple-400 mb-4" size={48} />
             <h2 className="text-5xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-600">
                HALL OF FAME
             </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 rounded-lg border border-gray-800">
           <table className="w-full text-left">
              <thead className="bg-purple-900/30 text-purple-300 font-display text-xs sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-4">RANK</th>
                  <th className="p-4">PILOT</th>
                  <th className="p-4 text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="font-mono text-lg">
                {loading ? (
                    <tr><td colSpan={3} className="p-8 text-center text-purple-400 animate-pulse">ACCESSING DATABASE...</td></tr>
                ) : scores.map((profile, index) => (
                  <tr key={profile.id} className="border-b border-gray-800 hover:bg-purple-500/10 transition-colors group">
                    <td className="p-4">
                        <span className={`
                            font-bold w-8 h-8 flex items-center justify-center rounded
                            ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_#facc15]' : 
                              index === 1 ? 'bg-gray-300 text-black' : 
                              index === 2 ? 'bg-orange-400 text-black' : 'text-gray-500'}
                        `}>
                            {index + 1}
                        </span>
                    </td>
                    <td className="p-4 text-white group-hover:text-purple-300 transition-colors">
                      {profile.username || `PILOT-${profile.id.substring(0, 4)}`}
                    </td>
                    <td className="p-4 text-right font-display text-cyan-400">
                      {profile.high_score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        <div className="mt-8 text-center">
          <button onClick={goBack} className="flex items-center justify-center gap-2 text-gray-400 hover:text-white mx-auto group">
             <ArrowLeft className="group-hover:-translate-x-1 transition-transform"/>
             <span className="font-bold tracking-widest">RETURN</span>
          </button>
        </div>

      </div>
    </div>
  );
};