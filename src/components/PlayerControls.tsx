import React, { useState } from "react";
import { Swords, Zap, Shield, ArrowLeft, Heart, Sparkles, Flame, ShieldAlert } from "lucide-react";
import { PLAYER_SPELLS } from "../utils/monsterData";
import { MagicSpell, Player } from "../types";
import { sounds } from "../utils/sound";

interface PlayerControlsProps {
  player: Player;
  isResolvingTurn: boolean;
  onPhysicalAttack: () => void;
  onMagicSpell: (spell: MagicSpell) => void;
  onDefend: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  player,
  isResolvingTurn,
  onPhysicalAttack,
  onMagicSpell,
  onDefend,
}) => {
  const [magicMenuOpen, setMagicMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"physical" | "magic">("physical");

  const handleHover = () => {
    sounds.playTick();
  };

  const selectSpell = (spell: MagicSpell) => {
    if (player.mp < spell.mpCost) return; // not enough mana
    onMagicSpell(spell);
    setMagicMenuOpen(false);
  };

  const filteredSpells = PLAYER_SPELLS.filter(
    (spell) => spell.category === activeCategory
  );

  return (
    <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-none shadow-xl relative" id="command-console-panel">
      {/* Loading Overlay when resolving actions */}
      {isResolvingTurn && (
        <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xs rounded-none z-20 flex items-center justify-center gap-3 animate-pulse border border-zinc-700" id="turn-resolving-overlay">
          <div className="flex space-x-1.5 justify-center items-center">
            <div className="h-1.5 w-1.5 bg-zinc-400 rounded-none"></div>
            <div className="h-1.5 w-1.5 bg-zinc-550 rounded-none"></div>
            <div className="h-1.5 w-1.5 bg-zinc-700 rounded-none"></div>
          </div>
          <span className="font-mono text-[9px] tracking-[0.25em] text-zinc-300 uppercase">
            Resolving Turn Matrix...
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2" id="controls-header">
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase">
          {magicMenuOpen ? "Skill System Selection" : "Direct Input Commands"}
        </span>
        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">
          SYS_READY // INPUT [1] [2] [3]
        </span>
      </div>

      {/* Control Buttons Grid */}
      <div className="min-h-[125px] flex items-center justify-center" id="controls-interact">
        {!magicMenuOpen ? (
          // Main Battle Command Panel - Sharp, modern geometric buttons, more compact (Design Guide Pattern)
          <div className="grid grid-cols-3 gap-2.5 w-full" id="command-grid-home">
            {/* Command 1: Physical Attack */}
            <button
              onClick={() => { onPhysicalAttack(); }}
              onMouseEnter={handleHover}
              className="group py-3 px-4 rounded-none bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-300 text-white hover:text-zinc-950 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left gap-1 select-none"
              id="cmd-attack"
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className="text-[8px] font-mono text-zinc-550 group-hover:text-zinc-650 transition-colors uppercase font-bold tracking-wider hidden sm:inline">01 // Cmd</span>
                <Swords className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-950 transition-colors mx-auto sm:mx-0" />
              </div>
              <span className="text-xs sm:text-sm font-light uppercase tracking-widest block leading-tight">通常攻撃</span>
              <span className="text-[8px] font-mono text-zinc-500 tracking-tight group-hover:text-zinc-650 font-light hidden sm:block mt-0.5">Standard Attack</span>
            </button>

            {/* Command 2: Skill attacks sub-menu */}
            <button
              onClick={() => { sounds.playTick(); setMagicMenuOpen(true); }}
              onMouseEnter={handleHover}
              className="group py-3 px-4 rounded-none bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-300 text-white hover:text-zinc-950 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left gap-1 select-none"
              id="cmd-magic-submenu"
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className="text-[8px] font-mono text-zinc-550 group-hover:text-zinc-650 transition-colors uppercase font-bold tracking-wider hidden sm:inline">02 // Sys</span>
                <Zap className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-950 transition-colors mx-auto sm:mx-0" />
              </div>
              <span className="text-xs sm:text-sm font-light uppercase tracking-widest block leading-tight">スキル</span>
              <span className="text-[8px] font-mono text-zinc-500 tracking-tight group-hover:text-zinc-650 font-light hidden sm:block mt-0.5">Phys & Magic</span>
            </button>

            {/* Command 3: Defense guard */}
            <button
              onClick={() => { onDefend(); }}
              onMouseEnter={handleHover}
              className="group py-3 px-4 rounded-none bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-300 text-white hover:text-zinc-950 transition-all cursor-pointer flex flex-col items-center sm:items-start text-center sm:text-left gap-1 select-none"
              id="cmd-defend"
            >
              <div className="flex items-center justify-between w-full mb-0.5">
                <span className="text-[8px] font-mono text-zinc-550 group-hover:text-zinc-650 transition-colors uppercase font-bold tracking-wider hidden sm:inline">03 // Sys</span>
                <Shield className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-950 transition-colors mx-auto sm:mx-0" />
              </div>
              <span className="text-xs sm:text-sm font-light uppercase tracking-widest block leading-tight">防御</span>
              <span className="text-[8px] font-mono text-zinc-500 tracking-tight group-hover:text-zinc-650 font-light hidden sm:block mt-0.5">Defend // +15 MP</span>
            </button>
          </div>
        ) : (
          // Magic/Physical Sub-selection select screen - Very compact
          <div className="w-full space-y-2.5" id="magic-spells-container">
            {/* Category selection Tabs */}
            <div className="flex border-b border-zinc-900 pb-2 gap-1.5" id="skill-category-tabs">
              <button
                type="button"
                onClick={() => { sounds.playTick(); setActiveCategory("physical"); }}
                className={`flex-1 py-1 px-3 text-[10px] font-mono tracking-widest transition-all cursor-pointer uppercase text-center border ${
                  activeCategory === "physical"
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold"
                    : "bg-zinc-950 text-zinc-550 border-zinc-900 hover:border-zinc-800 hover:text-zinc-300"
                }`}
              >
                物理スキル // PHYSICAL
              </button>
              <button
                type="button"
                onClick={() => { sounds.playTick(); setActiveCategory("magic"); }}
                className={`flex-1 py-1 px-3 text-[10px] font-mono tracking-widest transition-all cursor-pointer uppercase text-center border ${
                  activeCategory === "magic"
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold"
                    : "bg-zinc-950 text-zinc-550 border-zinc-900 hover:border-zinc-800 hover:text-zinc-300"
                }`}
              >
                魔法スキル // MAGICAL
              </button>
            </div>

            {/* List based on category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="spells-sub-grid">
              {filteredSpells.map((spell, idx) => {
                const canCast = player.mp >= spell.mpCost;
                return (
                  <button
                    key={spell.id}
                    disabled={!canCast}
                    onClick={() => selectSpell(spell)}
                    onMouseEnter={() => { if (canCast) handleHover(); }}
                    className={`p-2 rounded-none border text-left flex items-start gap-2.5 transition-colors cursor-pointer select-none ${
                      canCast
                        ? "bg-zinc-950 border-zinc-850 hover:bg-zinc-100 hover:text-zinc-950 text-white hover:border-zinc-300"
                        : "bg-zinc-950 text-zinc-650 border-zinc-900/40 opacity-45 cursor-not-allowed"
                    }`}
                    id={`spell-btn-${spell.id}`}
                  >
                    <div className="p-0.5 border border-zinc-850 shrink-0 text-center min-w-[18px]">
                      <span className="text-[8px] font-mono font-bold">0{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider font-light truncate">
                          {spell.name}
                        </span>
                        <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded-none ${canCast ? "bg-zinc-900 text-zinc-300 border border-zinc-800 group-hover:bg-zinc-200" : "bg-zinc-950 text-zinc-600"}`}>
                          {spell.mpCost} MP
                        </span>
                      </div>
                      <p className="text-[9px] font-light text-zinc-400 line-clamp-1 mt-0.5 italic">
                        {spell.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="flex justify-end pt-1" id="spell-back-row">
              <button
                onClick={() => { sounds.playTick(); setMagicMenuOpen(false); }}
                onMouseEnter={handleHover}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none border border-zinc-850 bg-zinc-950 hover:bg-zinc-100 hover:text-zinc-950 text-[10px] text-zinc-400 cursor-pointer transition-colors uppercase font-mono tracking-widest"
                id="spell-btn-back"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>キャンセル // BACK</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
