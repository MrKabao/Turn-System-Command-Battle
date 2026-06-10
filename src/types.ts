export interface Player {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  magic: number;
  defense: number;
  isDefending: boolean;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  baseAttack: number;
  baseMagic: number;
  baseDefense: number;
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  ownedItemIds: string[];
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  magic: number;
  description: string;
  avatarIcon: string; // lucide icon identifier or name
  bgGradient: string; // CSS gradient class
  difficulty: "Easy" | "Medium" | "Hard" | "Nightmare";
  behaviors: EnemyBehavior[]; // customized attack patterns
  statusEffects?: StatusEffect[];
}

export interface EnemyBehavior {
  name: string;
  actionText: string;
  type: "physical" | "magic" | "buff" | "special";
  damageMultiplier: number;
  mpDrain?: number;
  probability: number; // 0.0 - 1.0 weight
}

export interface StatusEffect {
  name: string;
  type: "burn" | "paralysis" | "shield";
  turnsRemaining: number;
}

export interface LogEntry {
  id: string;
  text: string;
  type: "player-attack" | "player-magic" | "player-defend" | "player-heal" | "enemy-action" | "system" | "victory" | "defeat";
  timestamp: string;
}

export interface MagicSpell {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  type: "damage" | "heal" | "status";
  category: "physical" | "magic";
  power: number; // multiplier or base healing
  color: string; // colors for buttons/effects
}

export interface DamagePopup {
  id: string;
  value: string; // Can be a number or "GUARD!" or "MISS" or "+20 MP"
  type: "damage-player" | "damage-enemy" | "heal-player" | "mp-player" | "text";
  x: number; // random offset x
  y: number; // random offset y
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}
