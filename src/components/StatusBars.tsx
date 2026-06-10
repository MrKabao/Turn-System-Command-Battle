import React from "react";
import { motion } from "motion/react";
import { Heart, Shield, Zap, Sparkles } from "lucide-react";
import { Player } from "../types";

interface StatusBarsProps {
  player: Player;
  enemyHp: number;
  enemyMaxHp: number;
}

export const StatusBars: React.FC<StatusBarsProps> = ({
  player,
  enemyHp,
  enemyMaxHp,
}) => {
  const calcPercent = (curr: number, max: number) => {
    return Math.max(0, Math.min(100, (curr / max) * 100));
  };

  const enemyHpPercent = calcPercent(enemyHp, enemyMaxHp);
  const playerHpPercent = calcPercent(player.hp, player.maxHp);
  const playerMpPercent = calcPercent(player.mp, player.maxMp);
  const playerExpPercent = calcPercent(player.exp, player.nextLevelExp);

  // Colors for Enemy Health (Transitions Green -> Yellow -> Red)
  const getHpColor = (percent: number) => {
    if (percent > 50) return "bg-emerald-500 shadow-emerald-500/50";
    if (percent > 20) return "bg-amber-500 shadow-amber-500/50";
    return "bg-rose-500 shadow-rose-500/50";
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3.5 w-full" id="status-bars-wrapper">
      {/* LEFT: Enemy Status HUD */}
      <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-none flex flex-col justify-between shadow-md relative overflow-hidden" id="enemy-status-card">
        {/* Fine crosshair markers in style design */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-zinc-700 border-t border-l border-zinc-500"></div>
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-zinc-700 border-t border-r border-zinc-500"></div>
        
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] sm:text-xs font-mono font-bold tracking-[0.1em] text-zinc-400 uppercase flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-red-650 shrink-0"></span>
            Enemy HP // 敵
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-100">
            {Math.max(0, enemyHp)} / {enemyMaxHp}
          </span>
        </div>

        {/* HP Bar Container (Sharp, rectangular design) */}
        <div className="relative w-full h-2 bg-zinc-900 border border-zinc-850 rounded-none overflow-hidden" id="enemy-hp-bar-outer">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${enemyHpPercent}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className={`h-full transition-colors duration-500 ${enemyHpPercent > 50 ? 'bg-red-650' : enemyHpPercent > 20 ? 'bg-amber-600' : 'bg-red-800'}`}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[8px] font-mono text-zinc-600 tracking-tight">
          <span>MIN: 0</span>
          <span>{Math.round(enemyHpPercent)}% CAPACITY</span>
        </div>
      </div>

      {/* RIGHT: Player Stats HUD */}
      <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-none shadow-md flex flex-col justify-between relative overflow-hidden" id="player-status-card">
        {/* Fine crosshair markers */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-zinc-700 border-t border-l border-zinc-500"></div>
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-zinc-700 border-t border-r border-zinc-500"></div>

        <div className="flex items-center justify-between mb-1.5" id="player-hud-header">
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.5 text-[8px] font-bold font-mono bg-zinc-900 text-zinc-300 border border-zinc-850 rounded-none shrink-0">
              LV_0{player.level}
            </span>
            <span className="text-[10px] font-light uppercase tracking-wider text-zinc-100 leading-none hidden sm:inline">
              HERO
            </span>
            {player.isDefending && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[7px] font-mono bg-zinc-900 text-cyan-400 border border-cyan-850 rounded-none uppercase animate-pulse">
                GUARD
              </span>
            )}
          </div>
          
          <div className="flex items-center text-[8px] font-mono text-zinc-500 gap-0.5" title="Experience Points">
            <Sparkles className="w-2.5 h-2.5 text-zinc-650" />
            <span className="truncate max-w-[55px] sm:max-w-none">EXP {player.exp}/{player.nextLevelExp}</span>
          </div>
        </div>

        {/* Player Dual Stats: HP and MP (Sharp block ratios) */}
        <div className="space-y-1.5" id="player-bars-grid">
          {/* Player HP */}
          <div>
            <div className="flex justify-between items-center text-[9px] mb-0.5">
              <span className="text-zinc-[450] flex items-center gap-1 font-mono uppercase tracking-wider">
                <Heart className="w-3 h-3 text-zinc-550" /> HP
              </span>
              <span className="font-mono text-zinc-150 font-bold">
                {player.hp}/{player.maxHp}
              </span>
            </div>
            <div className="relative w-full h-1.5 bg-zinc-900 border border-zinc-850 rounded-none overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${playerHpPercent}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="h-full bg-zinc-300"
              />
            </div>
          </div>

          {/* Player MP */}
          <div>
            <div className="flex justify-between items-center text-[9px] mb-0.5">
              <span className="text-zinc-[450] flex items-center gap-1 font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 text-zinc-550" /> MP
              </span>
              <span className="font-mono text-zinc-150 font-bold">
                {player.mp}/{player.maxMp}
              </span>
            </div>
            <div className="relative w-full h-1.5 bg-zinc-900 border border-zinc-850 rounded-none overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${playerMpPercent}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="h-full bg-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* EXP Minimap Bar */}
        <div className="mt-1.5 pt-1 border-t border-zinc-900" id="player-exp-subbar">
          <div className="w-full bg-zinc-900 h-0.5 rounded-none overflow-hidden" title="Level Progress">
            <motion.div
              animate={{ width: `${playerExpPercent}%` }}
              className="bg-zinc-650 h-full rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
