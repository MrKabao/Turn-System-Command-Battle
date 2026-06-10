import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Skull, Sparkles, Wind, Shield, Swords, Zap, HelpCircle } from "lucide-react";
import { Enemy, DamagePopup } from "../types";

interface EnemyArtProps {
  enemy: Enemy;
  isAttacking: boolean;
  isHit: boolean;
  isDead: boolean;
  damagePopups: DamagePopup[];
}

export const EnemyArt: React.FC<EnemyArtProps> = ({
  enemy,
  isAttacking,
  isHit,
  isDead,
  damagePopups,
}) => {
  // Map strings to Lucide Icons
  const renderIcon = () => {
    const sizeClasses = "w-14 h-14 md:w-18 md:h-18";
    switch (enemy.avatarIcon) {
      case "Flame":
        return <Flame className={`${sizeClasses} text-red-500 animate-[pulse_2s_infinite]`} id="icon-flame" />;
      case "Skull":
        return <Skull className={`${sizeClasses} text-purple-500 animate-[pulse_2s_infinite]`} id="icon-skull" />;
      case "Sparkles":
        return <Sparkles className={`${sizeClasses} text-emerald-400`} id="icon-sparkles" />;
      case "Wind":
        return <Wind className={`${sizeClasses} text-sky-450`} id="icon-wind" />;
      default:
        return <HelpCircle className={`${sizeClasses} text-zinc-550`} id="icon-help" />;
    }
  };

  // Determine shake or attack motion animations
  const animateState = () => {
    if (isDead) {
      return {
        opacity: 0,
        scale: 0.5,
        rotate: -45,
        y: 140,
        transition: { duration: 1.0, ease: "easeInOut" },
      };
    }
    if (isHit) {
      return {
        x: [0, -12, 12, -8, 8, -4, 4, 0],
        filter: [
          "brightness(1) saturate(1) contrast(1)",
          "brightness(1.8) saturate(2) contrast(1.2)",
          "brightness(1) saturate(1) contrast(1)"
        ],
        transition: { duration: 0.35 },
      };
    }
    if (isAttacking) {
      return {
        y: [0, -30, 90, 0],
        scale: [1, 1.1, 0.95, 1],
        transition: { duration: 0.5, ease: "easeOut" },
      };
    }
    return {
      y: [0, -4, 0],
      transition: { repeat: Infinity, duration: 4.0, ease: "easeInOut" },
    };
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4 min-h-[220px] md:min-h-[260px] rounded-none border border-zinc-900 bg-zinc-950 shadow-lg overflow-hidden transition-all duration-500" id="enemy-view-container">
      {/* Decorative Geometric Wireframes for Balance (Direct from Design specs) */}
      <div className="absolute inset-0 scale-[1.7] rotate-45 border border-zinc-900/30 opacity-20 pointer-events-none" />
      <div className="absolute inset-0 scale-[1.3] -rotate-12 border border-zinc-900/20 opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-zinc-805/10 rounded-full scale-100 pointer-events-none" />

      {/* Top Banner with Difficulty Badge */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-20" id="enemy-header">
        <span className="text-[8px] font-mono tracking-[0.3em] font-bold uppercase text-zinc-500">
          Target System Matrix
        </span>
        <span className={`px-1.5 py-0.5 rounded-none text-[9px] font-bold font-mono border-l-2 ${
          enemy.difficulty === "Easy" ? "bg-emerald-950/10 text-emerald-400 border-emerald-500/30" :
          enemy.difficulty === "Medium" ? "bg-sky-950/10 text-sky-400 border-sky-500/30" :
          enemy.difficulty === "Hard" ? "bg-amber-950/10 text-amber-500 border-amber-500/30" :
          "bg-red-950/10 text-red-400 border-red-500/30 animate-pulse"
        }`} id="enemy-level-indicator">
          T_0{enemy.difficulty === "Easy" ? "1" : enemy.difficulty === "Medium" ? "2" : enemy.difficulty === "Hard" ? "3" : "4"} // {enemy.difficulty}
        </span>
      </div>

      {/* Floating Damage/Heal Numbers (Popups) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-30" id="damage-popup-layer">
        <AnimatePresence>
          {damagePopups.map((popup) => {
            const isHeal = popup.type.includes("heal");
            const isMP = popup.type.includes("mp");
            const popupColor = isHeal 
              ? "text-emerald-400 font-bold text-xl font-mono" 
              : isMP 
                ? "text-cyan-400 font-semibold text-lg font-mono" 
                : "text-red-500 font-black text-2xl font-mono filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]";

            return (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, scale: 0.3, y: popup.y + 30, x: popup.x }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  scale: [0.7, 1.1, 1, 0.9], 
                  y: popup.y - 70, 
                  x: popup.x + (Math.random() * 16 - 8) 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`absolute left-1/2 top-1/2 -ml-16 w-32 text-center pointer-events-none select-none z-50`}
              >
                <span className={`${popupColor}`}>
                  {popup.value}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Structured Enemy Shape Frame (Double border layout from Design Spec) */}
      <div className="relative my-2 mt-7 z-10" id="enemy-sprite-container">
        <div className="w-28 h-28 md:w-32 md:h-32 bg-zinc-950 border border-zinc-850 flex items-center justify-center">
          <div className="w-22 h-22 md:w-26 md:h-26 border border-zinc-900 flex items-center justify-center bg-zinc-950/30">
            
            <motion.div
              animate={animateState()}
              className="relative flex items-center justify-center p-3"
              id="enemy-sprite-motion"
            >
              {renderIcon()}
              {isHit && (
                <div className="absolute inset-0 bg-red-650/15 border border-red-500 mix-blend-screen pointer-events-none" />
              )}
            </motion.div>

          </div>
        </div>
      </div>

      {/* Info Overlay (Geometric Balance italic headers) */}
      <div className="mt-2 text-center z-10" id="enemy-nameplate">
        <h3 className="text-base md:text-lg font-light tracking-[0.2em] text-zinc-150 uppercase italic flex items-center justify-center gap-1.5">
          {enemy.name}
          {enemy.hp <= 0 && (
            <span className="text-[8px] font-mono tracking-widest text-red-500 border border-red-500/30 bg-red-950/10 px-1 py-0.5 rounded-none font-bold">OUT_OF_SERVICE</span>
          )}
        </h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[280px] md:max-w-[400px] leading-snug select-none h-6 line-clamp-1 italic font-light">
          {enemy.description}
        </p>
      </div>

      {/* Secondary metadata tags */}
      <div className="flex gap-4 mt-2 text-[9px] font-mono text-zinc-550 uppercase tracking-widest border-t border-zinc-900 pt-2 w-48 justify-center" id="enemy-meta-stats">
        <div className="flex items-center gap-1" title="Physical Attack Power">
          <Swords className="w-3 h-3 text-zinc-650" />
          <span>ATK.{enemy.attack}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Physical Defense Rating">
          <Shield className="w-3 h-3 text-zinc-650" />
          <span>DEF.{enemy.defense}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Elemental Magic Mastery">
          <Zap className="w-3 h-3 text-zinc-650" />
          <span>MAG.{enemy.magic}</span>
        </div>
      </div>
    </div>
  );
};
