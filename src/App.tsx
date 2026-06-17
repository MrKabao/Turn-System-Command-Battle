import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Swords,
  Play,
  Check,
  Shield,
  Heart,
  BookOpen,
  Trophy,
  Skull,
  Award,
  Coins,
  ShoppingBag,
  ShieldCheck,
  User,
  HelpCircle,
  Bug,
  Wrench
} from "lucide-react";

import { Player, Enemy, LogEntry, MagicSpell, DamagePopup } from "./types";
import { MONSTERS, PLAYER_SPELLS } from "./utils/monsterData";
import { EQUIPMENT_ITEMS, EquipmentItem } from "./utils/equipmentData";
import { sounds } from "./utils/sound";
import { EnemyArt } from "./components/EnemyArt";
import { StatusBars } from "./components/StatusBars";
import { LogPanel } from "./components/LogPanel";
import { PlayerControls } from "./components/PlayerControls";

interface DifficultyConfig {
  id: "Easy" | "Medium" | "Hard" | "Nightmare";
  jpName: string;
  description: string;
  baseExpRange: string;
  baseGoldRange: string;
}

const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "Easy",
    jpName: "初級討伐作戦",
    description: "比較的安全な領域。スライムやゴブリンなどの低脅威度のモンスターを討伐し、基礎装備の実戦テストをします。",
    baseExpRange: "30",
    baseGoldRange: "40",
  },
  {
    id: "Medium",
    jpName: "中級討伐作戦",
    description: "古代遺跡や洞窟深部。ワイバーンやオーガが徘徊する危険地域。ポーションや魔法攻撃の入念な準備が求められます。",
    baseExpRange: "110",
    baseGoldRange: "180",
  },
  {
    id: "Hard",
    jpName: "上級討伐作戦",
    description: "王都廃城の深淵。闇を司る黒竜やキマイラが侵入者を阻む高難度エリア。強力な武具装備の調整を強く推奨します。",
    baseExpRange: "230",
    baseGoldRange: "460",
  },
  {
    id: "Nightmare",
    jpName: "悪夢級作戦",
    description: "冥府外縁。獄魔アスモデウスや宇宙的邪神クトゥルフが支配する破滅の絶対領域。極限まで鍛え抜かれた戦士以外は不可踏。",
    baseExpRange: "500",
    baseGoldRange: "1000",
  },
];

export default function App() {
  // Screen/State flags
  const [gameState, setGameState] = useState<"select-enemy" | "fighting" | "consecutive-choice" | "victory" | "defeat">("select-enemy");
  const [isMuted, setIsMuted] = useState(false);
  const [isResolvingTurn, setIsResolvingTurn] = useState(false);
  const [lobbyTab, setLobbyTab] = useState<"battle" | "status" | "shop" | "help">("battle");

  // Debug system states
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [isInstakill, setIsInstakill] = useState<boolean>(false);

  // Consecutive Run States
  const [currentRunDifficulty, setCurrentRunDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Nightmare" | null>(null);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);
  const [accumulatedBaseExp, setAccumulatedBaseExp] = useState<number>(0);
  const [accumulatedBaseGold, setAccumulatedBaseGold] = useState<number>(0);

  // Consecutive Win Multiplier Scaling
  const getConsecutiveMultiplier = (wins: number): number => {
    if (wins <= 1) return 1.0;
    if (wins === 2) return 1.25;
    if (wins === 3) return 1.6;
    if (wins === 4) return 2.1;
    if (wins === 5) return 2.8;
    if (wins === 6) return 3.6;
    if (wins === 7) return 4.5;
    if (wins === 8) return 5.6;
    if (wins === 9) return 7.0;
    return 7.0 + (wins - 9) * 1.5;
  };

  // Character States
  const [player, setPlayer] = useState<Player>({
    hp: 120,
    maxHp: 120,
    mp: 45,
    maxMp: 45,
    attack: 14,
    magic: 24,
    defense: 6,
    isDefending: false,
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    gold: 0,
    baseAttack: 14,
    baseMagic: 24,
    baseDefense: 6,
    equippedWeaponId: null,
    equippedArmorId: null,
    ownedItemIds: [],
  });

  const [currentEnemy, setCurrentEnemy] = useState<Enemy>(MONSTERS[0]);
  const [enemyHp, setEnemyHp] = useState<number>(MONSTERS[0].hp);

  // Text Battle Feed
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Graphical damage values popping over target
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [playerPopups, setPlayerPopups] = useState<DamagePopup[]>([]);

  // Animation Triggers
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [victoryRewards, setVictoryRewards] = useState<{ exp: number; gold: number } | null>(null);

  // Sync mute setting to player class
  useEffect(() => {
    sounds.setMute(isMuted);
  }, [isMuted]);

  // Bind Keyboard shortcuts: [1] Physical, [2] Magic Submenu, [3] Defense
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "fighting" || isResolvingTurn) return;
      
      // Look for numeral presses
      if (e.key === "1") {
        triggerPhysicalAttack();
      } else if (e.key === "3") {
        triggerDefense();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isResolvingTurn, player, currentEnemy]);

  // Push line item to Battle Feed
  const pushLog = (text: string, type: LogEntry["type"]) => {
    const timeString = new Date().toLocaleTimeString("ja-JP", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        text,
        type,
        timestamp: timeString,
      },
    ]);
  };

  // Helper: Spawn Floating Damage values over target
  const spawnDamagePopup = (value: string, type: DamagePopup["type"], isEnemy: boolean) => {
    const popupId = `popup-${Date.now()}-${Math.random()}`;
    const xOffset = Math.floor(Math.random() * 60) - 30; // -30px to +30px center jitter
    const yOffset = Math.floor(Math.random() * 40) - 20;

    const newPopup: DamagePopup = {
      id: popupId,
      value,
      type,
      x: xOffset,
      y: yOffset,
    };

    if (isEnemy) {
      setDamagePopups((prev) => [...prev, newPopup]);
      setTimeout(() => {
        setDamagePopups((prev) => prev.filter((p) => p.id !== popupId));
      }, 1200);
    } else {
      setPlayerPopups((prev) => [...prev, newPopup]);
      setTimeout(() => {
        setPlayerPopups((prev) => prev.filter((p) => p.id !== popupId));
      }, 1200);
    }
  };

  // --- EQUIPMENT SYSTEM MUTATORS ---
  const equipItem = (item: EquipmentItem) => {
    sounds.playLevelUp(); // play equip sound
    setPlayer((prev) => {
      let nextWeaponId = prev.equippedWeaponId;
      let nextArmorId = prev.equippedArmorId;

      if (item.type === "weapon") {
        nextWeaponId = item.id;
      } else {
        nextArmorId = item.id;
      }

      const nextOwnedItemIds = prev.ownedItemIds.includes(item.id)
        ? prev.ownedItemIds
        : [...prev.ownedItemIds, item.id];

      // Calculate total stats
      const curWeapon = EQUIPMENT_ITEMS.find((w) => w.id === nextWeaponId);
      const curArmor = EQUIPMENT_ITEMS.find((a) => a.id === nextArmorId);

      const weaponAtk = curWeapon?.attackBonus || 0;
      const weaponMag = curWeapon?.magicBonus || 0;
      const weaponDef = curWeapon?.defenseBonus || 0;

      const armorAtk = curArmor?.attackBonus || 0;
      const armorMag = curArmor?.magicBonus || 0;
      const armorDef = curArmor?.defenseBonus || 0;

      const totalAtk = prev.baseAttack + weaponAtk + armorAtk;
      const totalMag = prev.baseMagic + weaponMag + armorMag;
      const totalDef = prev.baseDefense + weaponDef + armorDef;

      return {
        ...prev,
        ownedItemIds: nextOwnedItemIds,
        equippedWeaponId: nextWeaponId,
        equippedArmorId: nextArmorId,
        attack: totalAtk,
        magic: totalMag,
        defense: totalDef,
      };
    });
  };

  const unequipItem = (type: "weapon" | "armor") => {
    sounds.playTick();
    setPlayer((prev) => {
      let nextWeaponId = prev.equippedWeaponId;
      let nextArmorId = prev.equippedArmorId;

      if (type === "weapon") {
        nextWeaponId = null;
      } else {
        nextArmorId = null;
      }

      // Calculate total stats
      const curWeapon = EQUIPMENT_ITEMS.find((w) => w.id === nextWeaponId);
      const curArmor = EQUIPMENT_ITEMS.find((a) => a.id === nextArmorId);

      const weaponAtk = curWeapon?.attackBonus || 0;
      const weaponMag = curWeapon?.magicBonus || 0;
      const weaponDef = curWeapon?.defenseBonus || 0;

      const armorAtk = curArmor?.attackBonus || 0;
      const armorMag = curArmor?.magicBonus || 0;
      const armorDef = curArmor?.defenseBonus || 0;

      const totalAtk = prev.baseAttack + weaponAtk + armorAtk;
      const totalMag = prev.baseMagic + weaponMag + armorMag;
      const totalDef = prev.baseDefense + weaponDef + armorDef;

      return {
        ...prev,
        equippedWeaponId: nextWeaponId,
        equippedArmorId: nextArmorId,
        attack: totalAtk,
        magic: totalMag,
        defense: totalDef,
      };
    });
  };

  const buyEquipment = (item: EquipmentItem) => {
    if (player.gold < item.cost) {
      sounds.playDefense(); // error buzzer
      return false;
    }

    sounds.playLevelUp(); // purchase chime!
    setPlayer((prev) => {
      const nextGold = prev.gold - item.cost;
      const nextOwnedItemIds = prev.ownedItemIds.includes(item.id)
        ? prev.ownedItemIds
        : [...prev.ownedItemIds, item.id];

      let nextWeaponId = prev.equippedWeaponId;
      let nextArmorId = prev.equippedArmorId;

      if (item.type === "weapon") {
        nextWeaponId = item.id;
      } else {
        nextArmorId = item.id;
      }

      // Calculate total stats
      const curWeapon = EQUIPMENT_ITEMS.find((w) => w.id === nextWeaponId);
      const curArmor = EQUIPMENT_ITEMS.find((a) => a.id === nextArmorId);

      const weaponAtk = curWeapon?.attackBonus || 0;
      const weaponMag = curWeapon?.magicBonus || 0;
      const weaponDef = curWeapon?.defenseBonus || 0;

      const armorAtk = curArmor?.attackBonus || 0;
      const armorMag = curArmor?.magicBonus || 0;
      const armorDef = curArmor?.defenseBonus || 0;

      const totalAtk = prev.baseAttack + weaponAtk + armorAtk;
      const totalMag = prev.baseMagic + weaponMag + armorMag;
      const totalDef = prev.baseDefense + weaponDef + armorDef;

      return {
        ...prev,
        gold: nextGold,
        ownedItemIds: nextOwnedItemIds,
        equippedWeaponId: nextWeaponId,
        equippedArmorId: nextArmorId,
        attack: totalAtk,
        magic: totalMag,
        defense: totalDef,
      };
    });
    return true;
  };

  // Setup chosen consecutive fight
  const startConsecutiveRun = (difficulty: "Easy" | "Medium" | "Hard" | "Nightmare") => {
    sounds.playTick();
    
    // Choose a random monster of this difficulty
    const candidates = MONSTERS.filter((m) => m.difficulty === difficulty);
    let randomMonster = candidates[Math.floor(Math.random() * candidates.length)];
    
    // プレイヤーのレベルが1の間は、初級討伐作戦(Easy)で最初の戦闘は必ずスライムが出現するようにする
    if (player.level === 1 && difficulty === "Easy") {
      const slimeMonster = candidates.find((m) => m.id === "slime");
      if (slimeMonster) {
        randomMonster = slimeMonster;
      }
    }
    
    // Initialize run parameters
    setCurrentRunDifficulty(difficulty);
    setConsecutiveWins(0);
    setAccumulatedBaseExp(0);
    setAccumulatedBaseGold(0);
    
    // Set active enemy
    setCurrentEnemy(randomMonster);
    setEnemyHp(randomMonster.hp);
    
    // Reset fight parameters and logs
    setLogs([]);
    setGameState("fighting");
    setIsResolvingTurn(false);
    
    // Full restore player on first start only
    setPlayer((prev) => ({
      ...prev,
      hp: prev.maxHp,
      mp: prev.maxMp,
      isDefending: false,
    }));

    pushLog(`【討伐作戦発動】 難易度 [${difficulty}] の連続討伐任務を受託しました。`, "system");
    pushLog(`⚠️ 部隊が敗北した時、蓄積報酬は全ロストします。適宜『撤退』を選択し安全に回収してください。`, "player-defend");
    pushLog(`⚔️ 第一戦闘開始： 凶狂なる標的「${randomMonster.name}」が侵入！`, "system");
  };

  // --- ACTIONS ---

  // 1. PHYSICAL ATTACK
  const triggerPhysicalAttack = () => {
    if (isResolvingTurn) return;
    setIsResolvingTurn(true);
    setPlayer((prev) => ({ ...prev, isDefending: false })); // Guard wears off

    sounds.playSlash();
    setIsEnemyHit(true);

    // Calculate Physical damage with randomness (variance ±20%)
    const baseDamage = player.attack - Math.floor(currentEnemy.defense / 2);
    const variance = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const finalDamage = Math.max(8, baseDamage + variance);

    // Multiplier for Critical strike (15% chance)
    const isCritical = (isDebugMode && isInstakill) ? true : Math.random() < 0.15;
    let damageDealt = isCritical ? Math.floor(finalDamage * 1.5) : finalDamage;

    // Apply debug instakill mode
    if (isDebugMode && isInstakill) {
      damageDealt = Math.max(99999, enemyHp);
    }

    const remainingEnemyHp = Math.max(0, enemyHp - damageDealt);
    setEnemyHp(remainingEnemyHp);

    // Spawn damage popups
    spawnDamagePopup(
      isCritical ? `CRIT! ${damageDealt}` : `${damageDealt}`,
      "damage-enemy",
      true
    );

    pushLog(
      `プレイヤーの通常攻撃！ ${isCritical ? "★会心の一撃！" : ""} ${currentEnemy.name}に ${damageDealt} の通常物理ダメージ！`,
      "player-attack"
    );

    // End impact animation
    setTimeout(() => {
      setIsEnemyHit(false);
      checkPostAction(remainingEnemyHp);
    }, 550);
  };

  // 2. SKILL CAST
  const triggerMagicSpell = (spell: MagicSpell) => {
    if (isResolvingTurn) return;
    setIsResolvingTurn(true);
    setPlayer((prev) => ({ ...prev, isDefending: false })); // Guard wears off

    // Pay spell mp cost
    setPlayer((prev) => ({ ...prev, mp: Math.max(0, prev.mp - spell.mpCost) }));

    if (spell.category === "physical") {
      if (spell.id === "double_slash") {
        // First strike
        sounds.playSlash();
        setIsEnemyHit(true);

        const baseDmg1 = Math.floor(player.attack * 0.7) - Math.floor(currentEnemy.defense / 4);
        const variance1 = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let finalDmg1 = Math.max(8, baseDmg1 + variance1);

        if (isDebugMode && isInstakill) {
          finalDmg1 = Math.max(99999, enemyHp);
        }

        const hpAfterFirst = Math.max(0, enemyHp - finalDmg1);
        setEnemyHp(hpAfterFirst);
        spawnDamagePopup(`${finalDmg1}`, "damage-enemy", true);
        pushLog(
          `プレイヤーの「${spell.name}」！ (1撃目) ${currentEnemy.name}に ${finalDmg1} の物理ダメージ！`,
          "player-attack"
        );

        setTimeout(() => {
          setIsEnemyHit(false);
        }, 220);

        // Second strike after a delay
        setTimeout(() => {
          sounds.playSlash();
          setIsEnemyHit(true);

          const baseDmg2 = Math.floor(player.attack * 0.7) - Math.floor(currentEnemy.defense / 4);
          const variance2 = Math.floor(Math.random() * 5) - 2;
          let finalDmg2 = Math.max(8, baseDmg2 + variance2);

          if (isDebugMode && isInstakill) {
            finalDmg2 = Math.max(99999, hpAfterFirst);
          }

          const hpAfterSecond = Math.max(0, hpAfterFirst - finalDmg2);
          setEnemyHp(hpAfterSecond);
          spawnDamagePopup(`${finalDmg2}`, "damage-enemy", true);
          pushLog(
            `プレイヤーの「${spell.name}」！ (2撃目) ${currentEnemy.name}に ${finalDmg2} の物理ダメージ！`,
            "player-attack"
          );

          setTimeout(() => {
            setIsEnemyHit(false);
            checkPostAction(hpAfterSecond);
          }, 350);

        }, 400);

      } else {
        sounds.playSlash();
        setIsEnemyHit(true);

        // Physical scale damage
        const baseDmg = Math.floor(player.attack * spell.power) - Math.floor(currentEnemy.defense / 2);
        const variance = Math.floor(Math.random() * 9) - 4; // -4 to +4
        let finalDmg = Math.max(16, baseDmg + variance);

        if (isDebugMode && isInstakill) {
          finalDmg = Math.max(99999, enemyHp);
        }

        const remainingHp = Math.max(0, enemyHp - finalDmg);
        setEnemyHp(remainingHp);

        spawnDamagePopup(`${finalDmg}`, "damage-enemy", true);
        pushLog(
          `プレイヤーはスキル「${spell.name}」を発動！ ${currentEnemy.name}に ${finalDmg} の物理ダメージ！`,
          "player-attack"
        );

        setTimeout(() => {
          setIsEnemyHit(false);
          checkPostAction(remainingHp);
        }, 600);
      }

    } else {
      // magic skills
      if (spell.type === "damage") {
        sounds.playMagic();
        setIsEnemyHit(true);

        // Magical scale bypassing normal armor
        let magDamage = Math.floor(player.magic * spell.power) - Math.floor(currentEnemy.defense / 4);
        // Lightning bolt has extreme variance
        if (spell.id === "lightning") {
          const randRatio = 0.5 + Math.random() * 1.2; // 0.5 - 1.7 scale
          magDamage = Math.floor(player.magic * spell.power * randRatio);
        }
        
        let finalDmg = Math.max(15, magDamage);
        if (isDebugMode && isInstakill) {
          finalDmg = Math.max(99999, enemyHp);
        }
        const remainingHp = Math.max(0, enemyHp - finalDmg);
        setEnemyHp(remainingHp);

        spawnDamagePopup(`${finalDmg}`, "damage-enemy", true);
        pushLog(
          `プレイヤーは魔法「${spell.name}」を発動！ ${currentEnemy.name}に ${finalDmg} の魔法ダメージ！`,
          "player-magic"
        );

        setTimeout(() => {
          setIsEnemyHit(false);
          checkPostAction(remainingHp);
        }, 600);

      } else if (spell.type === "heal") {
        sounds.playHeal();
        const healAmount = spell.power + Math.floor(player.magic / 2);
        const updatedHp = Math.min(player.maxHp, player.hp + healAmount);
        const realHealthGained = updatedHp - player.hp;

        setPlayer((prev) => ({ ...prev, hp: updatedHp }));
        spawnDamagePopup(`+${realHealthGained} HP`, "heal-player", false);

        pushLog(
          `プレイヤーは回復魔法「${spell.name}」を使用！ 自身の体力を ${realHealthGained} 回復！`,
          "player-heal"
        );

        setTimeout(() => {
          // Heal does not hit enemy, immediately proceed to enemy turn
          resolveEnemyTurn();
        }, 700);

      } else if (spell.type === "status") {
        // Spirit barrier: damage + drain
        sounds.playMagic();
        setIsEnemyHit(true);

        const barrierDmg = Math.floor(player.magic * 1.0) - Math.floor(currentEnemy.defense / 3);
        let finalDmg = Math.max(10, barrierDmg);
        if (isDebugMode && isInstakill) {
          finalDmg = Math.max(99999, enemyHp);
        }
        const drainHp = Math.min(player.maxHp - player.hp, 25);

        const remainingHp = Math.max(0, enemyHp - finalDmg);
        setEnemyHp(remainingHp);

        setPlayer((prev) => ({ ...prev, hp: prev.hp + drainHp }));

        spawnDamagePopup(`${finalDmg}`, "damage-enemy", true);
        if (drainHp > 0) {
          spawnDamagePopup(`+${drainHp} HP`, "heal-player", false);
        }

        pushLog(
          `プレイヤーは「${spell.name}」を展開！ ${currentEnemy.name}に ${finalDmg} の魔導衝撃を与え、自身の生命を ${drainHp} 吸収！`,
          "player-magic"
        );

        setTimeout(() => {
          setIsEnemyHit(false);
          checkPostAction(remainingHp);
        }, 650);
      }
    }
  };

  // 3. DEFENSE COMMAND
  const triggerDefense = () => {
    if (isResolvingTurn) return;
    setIsResolvingTurn(true);

    sounds.playDefense();

    // Golden shield barrier popup on player
    spawnDamagePopup("GUARD!", "text", false);

    // Recover MP on defense (Tactical choice!)
    const recoveredMp = Math.min(player.maxMp, player.mp + 15);
    const mpGain = recoveredMp - player.mp;
    setPlayer((prev) => ({
      ...prev,
      isDefending: true,
      mp: recoveredMp,
    }));

    if (mpGain > 0) {
      spawnDamagePopup(`+${mpGain} MP`, "mp-player", false);
    }

    pushLog(
      `プレイヤーは防御姿勢をとった！ 次の被ダメージを大軽減し、魔力を ${mpGain} 回復！`,
      "player-defend"
    );

    setTimeout(() => {
      resolveEnemyTurn(true);
    }, 600);
  };

  // Check battle continuity after players strike
  const checkPostAction = (currentHp: number) => {
    if (currentHp <= 0) {
      handleSingleCombatVictory();
    } else {
      resolveEnemyTurn();
    }
  };

  // --- ENEMY ACTION RESOLUTION ---
  const resolveEnemyTurn = (isDefendingThisTurn = false) => {
    // A brief delay to make the combat rhythmic
    setTimeout(() => {
      if (gameState === "defeat") return;

      setIsEnemyAttacking(true);

      // Choose enemy action based on probability
      const roll = Math.random();
      let cumulativeProb = 0;
      let selectedAction = currentEnemy.behaviors[0];

      for (const behavior of currentEnemy.behaviors) {
        cumulativeProb += behavior.probability;
        if (roll <= cumulativeProb) {
          selectedAction = behavior;
          break;
        }
      }

      // Log enemy's tell
      pushLog(`${selectedAction.actionText}`, "enemy-action");

      // Calculate final incoming damage
      let incomingDmg = 0;
      if (selectedAction.type === "physical") {
        sounds.playPlayerDamage();
        const baseAttack = Math.floor(currentEnemy.attack * selectedAction.damageMultiplier);
        incomingDmg = baseAttack - player.defense;
      } else if (selectedAction.type === "magic") {
        sounds.playMagic();
        sounds.playPlayerDamage();
        incomingDmg = Math.floor(currentEnemy.magic * selectedAction.damageMultiplier) - Math.floor(player.defense / 2);
      } else if (selectedAction.type === "buff") {
        sounds.playDefense();
        incomingDmg = Math.floor(currentEnemy.attack * selectedAction.damageMultiplier); // psychological minor damage
      }

      incomingDmg = Math.max(5, incomingDmg);

      // Apply defense reduction
      if (isDefendingThisTurn || player.isDefending) {
        incomingDmg = Math.max(1, Math.floor(incomingDmg * 0.3)); // 70% reduced! (Original 30% damage)
        pushLog(`▶ プレイヤーはガッチリ防御している！ダメージを大幅にカットした！`, "player-defend");
      }

      // Apply debug invincible mode
      if (isDebugMode && isInvincible) {
        incomingDmg = 0;
        pushLog(`🛡️【デバッグ無敵】 被ダメージを完全に無効化（0ダメージ）！`, "system");
      }

      const updatedPlayerHp = Math.max(0, player.hp - incomingDmg);
      
      // Enemy MP Drain effects
      let realMpDrain = 0;
      if (selectedAction.mpDrain && selectedAction.mpDrain > 0) {
        const oldMp = player.mp;
        const newMp = Math.max(0, player.mp - selectedAction.mpDrain);
        realMpDrain = oldMp - newMp;
        setPlayer((prev) => ({ ...prev, hp: updatedPlayerHp, mp: newMp }));
      } else {
        setPlayer((prev) => ({ ...prev, hp: updatedPlayerHp }));
      }

      // Animations and feedback
      setIsPlayerHit(true);
      spawnDamagePopup(`-${incomingDmg}`, "damage-player", false);
      if (realMpDrain > 0) {
        spawnDamagePopup(`-${realMpDrain} MP`, "mp-player", false);
        pushLog(`▶ プレイヤーの魔力が ${realMpDrain} 吸い取られた！`, "enemy-action");
      }

      // Clear Defending label for the next round
      setPlayer((prev) => ({ ...prev, isDefending: false }));

      // Clean animation cycles
      setTimeout(() => {
        setIsEnemyAttacking(false);
        setIsPlayerHit(false);

        if (updatedPlayerHp <= 0) {
          handleDefeat();
        } else {
          setIsResolvingTurn(false);
          // Turn-end MP recovery on turn passage
          setPlayer((prev) => {
            const nextMp = Math.min(prev.maxMp, prev.mp + 4);
            const mpDiff = nextMp - prev.mp;
            if (mpDiff > 0) {
              spawnDamagePopup(`+${mpDiff} MP`, "mp-player", false);
              pushLog(`ターン経過によりプレイヤーのMPが ${mpDiff} 回復した。`, "system");
            }
            return { ...prev, mp: nextMp };
          });
        }
      }, 600);

    }, 850); // small pause between turns
  };

  // --- VICTORY & DEFEAT MUTATORS ---

  const handleSingleCombatVictory = () => {
    sounds.playVictory();
    
    // Choose base values based on active difficulty
    let expReward = 30;
    let goldReward = 40;
    if (currentRunDifficulty === "Medium") {
      expReward = 110;
      goldReward = 180;
    } else if (currentRunDifficulty === "Hard") {
      expReward = 230;
      goldReward = 460;
    } else if (currentRunDifficulty === "Nightmare") {
      expReward = 500;
      goldReward = 1000;
    }

    const nextWins = consecutiveWins + 1;
    const nextBaseExp = accumulatedBaseExp + expReward;
    const nextBaseGold = accumulatedBaseGold + goldReward;

    setConsecutiveWins(nextWins);
    setAccumulatedBaseExp(nextBaseExp);
    setAccumulatedBaseGold(nextBaseGold);

    pushLog(`👑 討伐完了！ ${currentEnemy.name} を打ち倒した！ (連戦勝利数: ${nextWins}回)`, "victory");
    
    // Pause fighting screen and enter selection phase
    setGameState("consecutive-choice");
  };

  const continueRun = () => {
    sounds.playTick();
    if (!currentRunDifficulty) return;

    // Draw next random enemy of the matching difficulty
    const candidates = MONSTERS.filter((m) => m.difficulty === currentRunDifficulty);
    const randomMonster = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Set active enemy
    setCurrentEnemy(randomMonster);
    setEnemyHp(randomMonster.hp);
    
    // Reset fight parameters but preserve HP / MP status
    setPlayer((prev) => ({
      ...prev,
      isDefending: false,
    }));
    setIsResolvingTurn(false);
    setGameState("fighting");

    pushLog(`⚔️ 連戦継続： 第 ${consecutiveWins + 1} 戦開始！ ${randomMonster.name} が立ちはだかった！`, "system");
  };

  const retreatRun = () => {
    sounds.playTick();
    setIsResolvingTurn(true);

    const multiplier = getConsecutiveMultiplier(consecutiveWins);
    const finalExp = Math.floor(accumulatedBaseExp * multiplier);
    const finalGold = Math.floor(accumulatedBaseGold * multiplier);

    setVictoryRewards({ exp: finalExp, gold: finalGold });
    setGameState("victory");

    pushLog(`👑 連戦撤退成功！ 基地へ無事帰還しました。`, "victory");
    pushLog(`※ 獲得経験値(倍率適用): +${finalExp} EXP！`, "victory");
    pushLog(`💰 獲得資金(倍率適用): +${finalGold} G！`, "victory");

    // Process player stats integration including compound level up
    setPlayer((prev) => {
      let currentLevel = prev.level;
      let currentExp = prev.exp + finalExp;
      let currentTargetExp = prev.nextLevelExp;
      let currentBaseAtk = prev.baseAttack;
      let currentBaseMag = prev.baseMagic;
      let currentBaseDef = prev.baseDefense;
      let currentMaxHp = prev.maxHp;
      let currentMaxMp = prev.maxMp;
      let leveledUp = false;

      while (currentExp >= currentTargetExp) {
        leveledUp = true;
        currentExp -= currentTargetExp;
        currentLevel += 1;
        currentTargetExp = Math.floor(currentTargetExp * 1.35);
        currentBaseAtk += 3;
        currentBaseMag += 4;
        currentBaseDef += 2;
        currentMaxHp += 18;
        currentMaxMp += 6;
      }

      // Calculate totals with equipment active
      const curWeapon = EQUIPMENT_ITEMS.find((w) => w.id === prev.equippedWeaponId);
      const curArmor = EQUIPMENT_ITEMS.find((a) => a.id === prev.equippedArmorId);

      const weaponAtk = curWeapon?.attackBonus || 0;
      const weaponMag = curWeapon?.magicBonus || 0;
      const weaponDef = curWeapon?.defenseBonus || 0;

      const armorAtk = curArmor?.attackBonus || 0;
      const armorMag = curArmor?.magicBonus || 0;
      const armorDef = curArmor?.defenseBonus || 0;

      const totalAtk = currentBaseAtk + weaponAtk + armorAtk;
      const totalMag = currentBaseMag + weaponMag + armorMag;
      const totalDef = currentBaseDef + weaponDef + armorDef;

      if (leveledUp) {
        sounds.playLevelUp();
        pushLog(`✨【LEVEL UP!】 プレイヤーは レベル ${currentLevel} に到達しました！`, "victory");
        pushLog(`最大体力(+${currentMaxHp - prev.maxHp}) 最大魔力(+${currentMaxMp - prev.maxMp}) 攻撃(+${currentBaseAtk - prev.baseAttack}) 魔力(+${currentBaseMag - prev.baseMagic}) 防御(+${currentBaseDef - prev.baseDefense})`, "system");
        
        return {
          ...prev,
          level: currentLevel,
          exp: currentExp,
          nextLevelExp: currentTargetExp,
          gold: prev.gold + finalGold,
          maxHp: currentMaxHp,
          maxMp: currentMaxMp,
          baseAttack: currentBaseAtk,
          baseMagic: currentBaseMag,
          baseDefense: currentBaseDef,
          attack: totalAtk,
          magic: totalMag,
          defense: totalDef,
          hp: currentMaxHp, // Fully healed on level up
          mp: currentMaxMp,
        };
      } else {
        return {
          ...prev,
          exp: currentExp,
          gold: prev.gold + finalGold,
          hp: prev.maxHp, // Fully healed on retreat
          mp: prev.maxMp, // Fully healed on retreat
        };
      }
    });

    setIsResolvingTurn(false);
  };

  const handleDefeat = () => {
    sounds.playDefeat();
    setGameState("defeat");
    pushLog(`☠ プレイヤーの体力がゼロになった... 目の前が真っ暗になった。`, "defeat");
    pushLog(`❌ 【連戦失敗】 敗北したため、蓄積されていた経験値とゴールドはすべて失われました。`, "defeat");
    setConsecutiveWins(0);
    setAccumulatedBaseExp(0);
    setAccumulatedBaseGold(0);
  };

  // Restore player, reset combat screen
  const restartGame = () => {
    sounds.playTick();
    setVictoryRewards(null);
    setGameState("select-enemy");
    setLogs([]);
    setDamagePopups([]);
    setPlayerPopups([]);
    setConsecutiveWins(0);
    setAccumulatedBaseExp(0);
    setAccumulatedBaseGold(0);
    setCurrentRunDifficulty(null);
    
    // Fully heal player back to maximum when returning to selection/map
    setPlayer((prev) => ({
      ...prev,
      hp: prev.maxHp,
      mp: prev.maxMp,
    }));
  };

  const debugLevelUp = () => {
    sounds.playLevelUp();
    setPlayer((prev) => {
      const nextLevel = prev.level + 1;
      const nextTargetExp = Math.floor(prev.nextLevelExp * 1.35);
      const nextBaseAtk = prev.baseAttack + 3;
      const nextBaseMag = prev.baseMagic + 4;
      const nextBaseDef = prev.baseDefense + 2;
      const nextMaxHp = prev.maxHp + 18;
      const nextMaxMp = prev.maxMp + 6;

      // Calculate totals with active equipment
      const curWeapon = EQUIPMENT_ITEMS.find((w) => w.id === prev.equippedWeaponId);
      const curArmor = EQUIPMENT_ITEMS.find((a) => a.id === prev.equippedArmorId);

      const weaponAtk = curWeapon?.attackBonus || 0;
      const weaponMag = curWeapon?.magicBonus || 0;
      const weaponDef = curWeapon?.defenseBonus || 0;

      const armorAtk = curArmor?.attackBonus || 0;
      const armorMag = curArmor?.magicBonus || 0;
      const armorDef = curArmor?.defenseBonus || 0;

      const totalAtk = nextBaseAtk + weaponAtk + armorAtk;
      const totalMag = nextBaseMag + weaponMag + armorMag;
      const totalDef = nextBaseDef + weaponDef + armorDef;

      pushLog(`🛠️【デバッグレベルアップ】 レベル ${nextLevel} になりました！`, "system");

      return {
        ...prev,
        level: nextLevel,
        nextLevelExp: nextTargetExp,
        maxHp: nextMaxHp,
        maxMp: nextMaxMp,
        baseAttack: nextBaseAtk,
        baseMagic: nextBaseMag,
        baseDefense: nextBaseDef,
        attack: totalAtk,
        magic: totalMag,
        defense: totalDef,
        hp: nextMaxHp,
        mp: nextMaxMp,
      };
    });
  };

  const debugAddGold = () => {
    sounds.playTick();
    setPlayer((prev) => {
      const addedGold = 50000;
      pushLog(`🛠️【デバッグゴールド付与】 +${addedGold} G 獲得！`, "system");
      return {
        ...prev,
        gold: prev.gold + addedGold,
      };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans relative antialiased selection:bg-zinc-100 selection:text-zinc-950 pb-6" id="rpg-app-root">
      {/* Background Retro Grid scan overlay and geometric grid matrix */}
      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.02] z-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* HEADER BAR (Geometric sleek flat look) */}
      <header className="border-b border-zinc-900 bg-zinc-950 px-4 py-4 md:px-8 flex items-center justify-between z-10" id="global-header">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-600 rounded-none shrink-0" />
          <div>
            <h1 className="text-sm md:text-base font-light tracking-[0.2em] text-zinc-100 uppercase italic leading-none">
              Tactical Combat Matrix // 戦闘術
            </h1>
            <p className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest mt-1 hidden sm:block">
              Turn-Based Command Battle System 1.0.4b
            </p>
          </div>
        </div>

        {/* UTILITY BAR Controls */}
        <div className="flex items-center gap-3" id="utility-bar">
          {/* Debug Mode Switch Button */}
          <button
            onClick={() => {
              sounds.playTick();
              setIsDebugMode(!isDebugMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer rounded-none font-bold ${
              isDebugMode 
                ? "bg-red-950/40 text-red-400 border-red-800 hover:bg-red-900/40" 
                : "bg-zinc-950 text-zinc-550 border-zinc-900 hover:border-zinc-700 hover:text-zinc-300"
            }`}
            title="Toggle Debug Console // デバッグモード切替"
            id="btn-debug-toggle"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>DEBUG: {isDebugMode ? "ON // 有効" : "OFF // 無効"}</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-300 text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer rounded-none"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            id="btn-mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>
        </div>
      </header>

      {/* GLOBAL DEBUG OVERLAY MATRIX PANEL */}
      {isDebugMode && (
        <div className="bg-red-950/20 border-b border-red-900/40 px-4 py-2.5 md:px-8 flex flex-wrap items-center justify-between gap-3 text-xs select-none z-10" id="global-debug-panel">
          <div className="flex items-center gap-2 text-red-400 font-mono font-bold">
            <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
            <span className="tracking-wide">DEBUG CHIPS ACTIVE // デバッグ特権介入システム</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {/* Invincible toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-mono font-bold text-xs select-none">
              <input
                type="checkbox"
                checked={isInvincible}
                onChange={() => {
                  sounds.playTick();
                  setIsInvincible(!isInvincible);
                }}
                className="w-3.5 h-3.5 accent-red-600 rounded-none cursor-pointer"
              />
              <span className={isInvincible ? "text-red-400 font-bold" : "text-zinc-500"}>
                🛡️ 無敵化 (被ダメ0): {isInvincible ? "ENABLED // 有効" : "DISABLED // 無効"}
              </span>
            </label>

            {/* Instakill toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-mono font-bold text-xs select-none">
              <input
                type="checkbox"
                checked={isInstakill}
                onChange={() => {
                  sounds.playTick();
                  setIsInstakill(!isInstakill);
                }}
                className="w-3.5 h-3.5 accent-red-600 rounded-none cursor-pointer"
              />
              <span className={isInstakill ? "text-red-450 font-bold" : "text-zinc-500"}>
                💥 一撃必殺 (ワンパン): {isInstakill ? "ENABLED // 有効" : "DISABLED // 無効"}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* MAIN SCREEN GRID */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-2 md:py-3.5 flex flex-col justify-start gap-3 h-full z-10" id="main-viewport">
        
        {/* VIEWPORT 1: SELECT OPPONENT SCREEN */}
        {gameState === "select-enemy" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col justify-center py-4"
            id="view-select-enemy"
          >
            {/* Top Lobby Tabs */}
            <div className="flex justify-center border-b border-zinc-900 mb-4 overflow-x-auto" id="lobby-nav-tabs">
              <button
                onClick={() => { sounds.playTick(); setLobbyTab("battle"); }}
                className={`flex-1 sm:flex-initial py-2 px-3 sm:px-5 text-xs font-mono tracking-widest transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 border-b-2 shrink-0 ${
                  lobbyTab === "battle"
                    ? "text-zinc-100 border-red-600 font-bold bg-zinc-900/35"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800"
                }`}
                id="tab-btn-battle"
              >
                <Swords className="w-3.5 h-3.5 text-red-500" />
                <span>BATTLE // 討伐作戦</span>
              </button>

              <button
                onClick={() => { sounds.playTick(); setLobbyTab("status"); }}
                className={`flex-1 sm:flex-initial py-2 px-3 sm:px-5 text-xs font-mono tracking-widest transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 border-b-2 shrink-0 ${
                  lobbyTab === "status"
                    ? "text-zinc-100 border-red-600 font-bold bg-zinc-900/35"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800"
                }`}
                id="tab-btn-status"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>STATUS // 装備・能力</span>
              </button>

              <button
                onClick={() => { sounds.playTick(); setLobbyTab("shop"); }}
                className={`flex-1 sm:flex-initial py-2 px-3 sm:px-5 text-xs font-mono tracking-widest transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 border-b-2 shrink-0 ${
                  lobbyTab === "shop"
                    ? "text-zinc-100 border-red-600 font-bold bg-zinc-900/35"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800"
                }`}
                id="tab-btn-shop"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                <span>GEAR_SHOP // 武具屋</span>
              </button>

              <button
                onClick={() => { sounds.playTick(); setLobbyTab("help"); }}
                className={`flex-1 sm:flex-initial py-2 px-3 sm:px-5 text-xs font-mono tracking-widest transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 border-b-2 shrink-0 ${
                  lobbyTab === "help"
                    ? "text-zinc-100 border-red-600 font-bold bg-zinc-900/35"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800"
                }`}
                id="tab-btn-help"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>HELP // 遊び方</span>
              </button>
            </div>

            {/* Header info bar (showing Gold, LV, EXP progress) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-zinc-950/80 border border-zinc-900 px-4 py-2.5 mb-6 font-mono text-[11px] text-zinc-400 gap-2" id="lobby-stats-bar">
              <div className="flex items-center gap-2.5">
                <span className="text-[9px] tracking-widest text-zinc-500 uppercase">SYS_ACT_STATUS:</span>
                <span className="text-zinc-[100] font-bold bg-zinc-900 px-1.5 py-0.5 border border-zinc-850">LV_0{player.level}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                <span className="text-[9px] tracking-widest text-zinc-500 uppercase">FUNDS_AVAILABLE:</span>
                <div className="flex items-center gap-1 text-amber-400 bg-zinc-900 px-2 py-0.5 border border-zinc-850">
                  <Coins className="w-3.5 h-3.5 text-amber-500 animate-[pulse_2s_infinite]" />
                  <span className="font-bold text-zinc-100 text-xs">{player.gold}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5 font-bold">G</span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: BATTLE LIST */}
            {lobbyTab === "battle" && (
              <div className="space-y-6" id="battle-target-selection">
                <div className="text-center mb-6" id="menu-headline">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-red-500 font-bold uppercase block mb-1">
                    Awaiting Target Assignment // 命令待機中
                  </span>
                  <h2 className="text-2xl md:text-3xl font-light tracking-[0.12em] text-zinc-100 uppercase italic">
                    討伐作戦難易度を選択してください
                  </h2>
                </div>

                {/* Boss list bento grid - Non-rounded sharp geometric balance theme card units */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="opponent-cards-grid">
                  {DIFFICULTIES.map((config) => (
                    <div
                      key={config.id}
                      onClick={() => startConsecutiveRun(config.id)}
                      className={`relative p-5 rounded-none border bg-zinc-950/75 hover:bg-zinc-100 text-zinc-100 hover:text-zinc-950 transition-all cursor-pointer group flex flex-col justify-between h-[95px] overflow-hidden ${
                        config.id === "Easy" ? "border-zinc-900 hover:border-emerald-500" :
                        config.id === "Medium" ? "border-zinc-900 hover:border-sky-500" :
                        config.id === "Hard" ? "border-zinc-900 hover:border-amber-500" :
                        "border-zinc-900 hover:border-red-500"
                      }`}
                      id={`opponent-card-${config.id}`}
                    >
                      <div id="opponent-top-info">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${
                            config.id === "Easy" ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30 group-hover:bg-zinc-200 group-hover:text-emerald-800" :
                            config.id === "Medium" ? "bg-sky-950/20 text-sky-400 border-sky-500/30 group-hover:bg-zinc-200 group-hover:text-sky-800" :
                            config.id === "Hard" ? "bg-amber-950/20 text-amber-550 border-amber-550/30 group-hover:bg-zinc-200 group-hover:text-amber-800" :
                            "bg-red-950/10 text-red-400 border-red-500/40 animate-pulse group-hover:bg-zinc-200 group-hover:text-red-700"
                          }}`}>
                            {config.id}
                          </span>
                          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-650 font-mono">
                            BASE // EXP: +{config.baseExpRange} / GOLD: +{config.baseGoldRange}
                          </span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-light tracking-[0.08em] uppercase italic">
                          {config.jpName}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DETAILED STATUS */}
            {lobbyTab === "status" && (
              <div className="space-y-4" id="status-detailed-panel">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* HERO GENERAL STATUS CARD */}
                  <div className="bg-zinc-950 border border-zinc-900 p-5 relative flex flex-col justify-between" id="hero-profile-card">
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-zinc-700" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-zinc-700" />
                    
                    <div>
                      <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-400 border-b border-zinc-900 pb-2 mb-4 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" /> Hero Identity // 勇者のステータス
                      </h3>

                      <div className="space-y-4">
                        {/* Avatar Box Mock */}
                        <div className="flex items-center gap-4 bg-zinc-900/15 p-3 border border-zinc-900">
                          <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 flex items-center justify-center font-mono text-zinc-400 font-bold text-base select-none">
                            H
                          </div>
                          <div>
                            <div className="text-zinc-100 font-bold tracking-wider text-xs uppercase">勇者 (HERO) // ACTIVE</div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">LEVEL 0{player.level} // TACTICAL COMM</div>
                          </div>
                        </div>

                        {/* Vital stats bar gauges */}
                        <div className="space-y-3 font-mono text-[11px]">
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-zinc-450 uppercase">VITAL_HP (体力)</span>
                              <span className="text-zinc-200 font-bold">{player.hp} / {player.maxHp}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-900 border border-zinc-850">
                              <div className="h-full bg-zinc-300" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-zinc-450 uppercase">ENERGY_MP (魔力)</span>
                              <span className="text-zinc-200 font-bold">{player.mp} / {player.maxMp}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-900 border border-zinc-850">
                              <div className="h-full bg-zinc-500" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-zinc-400 uppercase">SYS_EXP (経験値)</span>
                              <span className="text-zinc-450 font-bold">EXP {player.exp} / {player.nextLevelExp}</span>
                            </div>
                            <div className="h-1 bg-zinc-900 border border-zinc-850">
                              <div className="h-full bg-zinc-400" style={{ width: `${(player.exp / player.nextLevelExp) * 100}%` }} />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[9px] font-mono text-zinc-500">
                              <span>NEXT LEVEL // 次のレベルまで</span>
                              <span className="text-zinc-300 font-bold">{Math.max(0, player.nextLevelExp - player.exp)} EXP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ATTRIBUTE MATRIX (Base & Total) */}
                  <div className="bg-zinc-950 border border-zinc-900 p-5 relative" id="hero-attributes-card">
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-zinc-700" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-zinc-700" />

                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-400 border-b border-zinc-900 pb-2 mb-4">
                      Attribute Matrix // 能力特性
                    </h3>

                    <div className="space-y-2 font-mono text-[11px]">
                      {/* Max HP */}
                      <div className="flex items-center justify-between p-2 border border-zinc-900/50 bg-zinc-900/10">
                        <span className="text-zinc-400">最大体力 (MAX_HP)</span>
                        <div className="text-right">
                          <span className="text-zinc-150 font-bold text-xs">{player.maxHp}</span>
                        </div>
                      </div>

                      {/* Max MP */}
                      <div className="flex items-center justify-between p-2 border border-zinc-900/50 bg-zinc-900/10">
                        <span className="text-zinc-400">最大魔力 (MAX_MP)</span>
                        <div className="text-right">
                          <span className="text-zinc-150 font-bold text-xs">{player.maxMp}</span>
                        </div>
                      </div>

                      {/* Attack */}
                      <div className="flex items-center justify-between p-2 border border-zinc-900/50 bg-zinc-900/15">
                        <span className="text-zinc-400">物理攻撃力 (ATTACK)</span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-550 mr-2">（基礎 {player.baseAttack}）</span>
                          <span className="text-zinc-100 font-bold text-xs bg-zinc-900 px-1 border border-zinc-850">計 {player.attack}</span>
                          {player.attack - player.baseAttack > 0 && (
                            <span className="text-emerald-400 text-[10px] ml-1.5 font-bold">+{player.attack - player.baseAttack}</span>
                          )}
                        </div>
                      </div>

                      {/* Magic */}
                      <div className="flex items-center justify-between p-2 border border-zinc-900/50 bg-zinc-900/15">
                        <span className="text-zinc-400">魔導精神 (MAGIC)</span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-550 mr-2">（基礎 {player.baseMagic}）</span>
                          <span className="text-zinc-100 font-bold text-xs bg-zinc-900 px-1 border border-zinc-850">計 {player.magic}</span>
                          {player.magic - player.baseMagic > 0 && (
                            <span className="text-cyan-400 text-[10px] ml-1.5 font-bold">+{player.magic - player.baseMagic}</span>
                          )}
                        </div>
                      </div>

                      {/* Defense */}
                      <div className="flex items-center justify-between p-2 border border-zinc-900/50 bg-zinc-900/15">
                        <span className="text-zinc-400">防御障壁 (DEFENSE)</span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-550 mr-2">（基礎 {player.baseDefense}）</span>
                          <span className="text-zinc-100 font-bold text-xs bg-zinc-900 px-1 border border-zinc-850">計 {player.defense}</span>
                          {player.defense - player.baseDefense > 0 && (
                            <span className="text-amber-400 text-[10px] ml-1.5 font-bold">+{player.defense - player.baseDefense}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIVE LOADOUT EQUIPMENT */}
                <div className="bg-zinc-950 border border-zinc-900 p-5 relative" id="hero-equipment-card">
                  <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-400 border-b border-zinc-900 pb-2 mb-4">
                    Active Loadout Gears // 現在の装備
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Weapon slot */}
                    <div className="border border-zinc-905 p-3 bg-zinc-900/10 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block mb-1">WEAPON SLOT // 武器</span>
                        {player.equippedWeaponId ? (
                          (() => {
                            const weapon = EQUIPMENT_ITEMS.find((item) => item.id === player.equippedWeaponId);
                            if (!weapon) return <span className="text-zinc-500 font-mono text-xs">ERR_GEAR_NOT_FOUND</span>;
                            return (
                              <div className="mt-1">
                                <h4 className="text-xs font-bold text-zinc-100">{weapon.jpName}</h4>
                                <p className="text-[10px] text-zinc-400 mt-1 italic font-light">{weapon.description}</p>
                                <div className="flex gap-3 mt-2 text-[10px] font-mono">
                                  {weapon.attackBonus > 0 && <span className="text-emerald-450 font-bold">ATK +{weapon.attackBonus}</span>}
                                  {weapon.magicBonus > 0 && <span className="text-cyan-450 font-bold">MAG +{weapon.magicBonus}</span>}
                                  {weapon.defenseBonus > 0 && <span className="text-amber-450 font-bold">DEF +{weapon.defenseBonus}</span>}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-zinc-650 font-mono italic mt-2">NO WEAPON EQUIPPED // 未装備</p>
                        )}
                      </div>
                      
                      {player.equippedWeaponId && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => unequipItem("weapon")}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-350 text-[9px] font-mono text-zinc-400 hover:text-zinc-950 cursor-pointer transition-colors uppercase tracking-widest rounded-none"
                          >
                            外す // UNEQUIP
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Armor slot */}
                    <div className="border border-zinc-905 p-3 bg-zinc-900/10 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block mb-1">ARMOR SLOT // 防具</span>
                        {player.equippedArmorId ? (
                          (() => {
                            const armor = EQUIPMENT_ITEMS.find((item) => item.id === player.equippedArmorId);
                            if (!armor) return <span className="text-zinc-500 font-mono text-xs">ERR_GEAR_NOT_FOUND</span>;
                            return (
                              <div className="mt-1">
                                <h4 className="text-xs font-bold text-zinc-100">{armor.jpName}</h4>
                                <p className="text-[10px] text-zinc-400 mt-1 italic font-light">{armor.description}</p>
                                <div className="flex gap-3 mt-2 text-[10px] font-mono">
                                  {armor.attackBonus > 0 && <span className="text-emerald-450 font-bold">ATK +{armor.attackBonus}</span>}
                                  {armor.magicBonus > 0 && <span className="text-cyan-450 font-bold">MAG +{armor.magicBonus}</span>}
                                  {armor.defenseBonus > 0 && <span className="text-amber-450 font-bold">DEF +{armor.defenseBonus}</span>}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-zinc-650 font-mono italic mt-2">NO ARMOR EQUIPPED // 未装備</p>
                        )}
                      </div>
                      
                      {player.equippedArmorId && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => unequipItem("armor")}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-100 border border-zinc-850 hover:border-zinc-350 text-[9px] font-mono text-zinc-400 hover:text-zinc-950 cursor-pointer transition-colors uppercase tracking-widest rounded-none"
                          >
                            外す // UNEQUIP
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Owned equipment vault */}
                    <div className="mt-6 border-t border-zinc-900 pt-5">
                      <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block mb-3 flex items-center justify-between">
                        <span>OWNED VAULT // 所持武具・予備装備</span>
                        <span className="text-[8px] text-zinc-650 font-bold uppercase">
                          {isDebugMode ? "ALL (DEBUG)" : `${player.ownedItemIds.length} items`}
                        </span>
                      </span>
                      {!isDebugMode && player.ownedItemIds.length === 0 ? (
                        <p className="text-xs text-zinc-550 font-mono italic text-center py-4 border border-dashed border-zinc-900">
                          NO SPARE GEAR // 所持武具がありません（工廠で購入できます）
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {EQUIPMENT_ITEMS.filter((item) => isDebugMode || player.ownedItemIds.includes(item.id)).map((item) => {
                            const isEquipped = player.equippedWeaponId === item.id || player.equippedArmorId === item.id;
                            return (
                              <div
                                key={item.id}
                                className={`p-2.5 border flex items-center justify-between gap-3 ${
                                  isEquipped ? "border-zinc-750 bg-zinc-900/20" : "border-zinc-900 bg-zinc-950/20"
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">{item.type}</span>
                                  <h4 className="text-xs font-bold text-zinc-200 mt-0.5">{item.jpName}</h4>
                                  <div className="flex gap-2.5 mt-1 text-[9px] font-mono">
                                    {item.attackBonus > 0 && <span className="text-emerald-450 font-bold">+{item.attackBonus} ATK</span>}
                                    {item.magicBonus > 0 && <span className="text-cyan-450 font-bold">+{item.magicBonus} MAG</span>}
                                    {item.defenseBonus > 0 && <span className="text-amber-450 font-bold">+{item.defenseBonus} DEF</span>}
                                  </div>
                                </div>
                                <button
                                  disabled={isEquipped}
                                  onClick={() => equipItem(item)}
                                  className={`px-3 py-1 text-[10px] font-mono select-none cursor-pointer rounded-none uppercase transition-all shrink-0 ${
                                    isEquipped
                                      ? "bg-zinc-900/60 text-zinc-650 border border-zinc-900 cursor-not-allowed"
                                      : "bg-zinc-100 text-zinc-950 hover:bg-zinc-300 font-bold"
                                  }`}
                                >
                                  {isEquipped ? "装備中" : "装備"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EQUIPMENT GEAR SHOP */}
            {lobbyTab === "shop" && (
              <div className="space-y-4" id="equipment-gear-shop">
                <div className="text-center mb-6">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-amber-500 font-bold uppercase block mb-1">
                    Weapon & Armor Supply Terminal // 武器製造・調達工廠
                  </span>
                  <h3 className="text-xl font-light text-zinc-100 uppercase tracking-[0.1em]">
                    武具を購入して戦闘力を強化してください
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto italic font-light">
                    貯めたゴールドで強力な武具を購入できます。購入した武具は自動的に即時装備されます。
                  </p>
                </div>

                {/* DEBUG INSTANT ACTIONS PANEL */}
                {isDebugMode && (
                  <div className="bg-red-950/15 border border-red-900/40 p-4" id="debug-instant-shop-actions">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-red-400 font-bold uppercase block mb-2.5">
                      🛠️ DEBUG SERVICES PANEL // デバッグチート端末
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={debugLevelUp}
                        className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-800 text-xs font-mono text-zinc-100 tracking-wider uppercase transition-all cursor-pointer font-bold rounded-none flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-4 h-4 text-red-500" />
                        <span>レベルを無条件に1上げる // LEVEL UP</span>
                      </button>
                      <button
                        onClick={debugAddGold}
                        className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-800 text-xs font-mono text-zinc-100 tracking-wider uppercase transition-all cursor-pointer font-bold rounded-none flex items-center justify-center gap-2"
                      >
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>ゴールド+50,000G付与 // ADD GOLD</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WEAPONS SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono tracking-widest text-zinc-400 uppercase border-b border-zinc-900 pb-1 flex items-center justify-between">
                      <span>WEAPONS // 攻撃装備</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase">weapon_class</span>
                    </h4>

                    <div className="space-y-2">
                      {EQUIPMENT_ITEMS.filter((item) => item.type === "weapon").map((item) => {
                        const isEquipped = player.equippedWeaponId === item.id;
                        const isOwned = isDebugMode || player.ownedItemIds.includes(item.id);
                        const canAfford = player.gold >= item.cost;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 border select-none transition-all rounded-none flex items-center justify-between gap-4 ${
                              isEquipped 
                                ? "border-zinc-750 bg-zinc-900/30" 
                                : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-mono text-zinc-650 block">
                                {isOwned ? "PURCHASED // 所有済み" : `WEAPON // VAL_0${item.cost}`}
                              </span>
                              <h5 className="text-xs font-bold text-zinc-200 mt-0.5">{item.jpName}</h5>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic font-light">{item.description}</p>
                              <div className="flex gap-3 mt-1.5 text-[10px] font-mono">
                                {item.attackBonus > 0 && <span className="text-emerald-400">攻撃 +{item.attackBonus}</span>}
                                {item.magicBonus > 0 && <span className="text-cyan-400">魔力 +{item.magicBonus}</span>}
                                {item.defenseBonus > 0 && <span className="text-amber-400">防御 +{item.defenseBonus}</span>}
                              </div>
                            </div>

                            <button
                              disabled={isEquipped || (!isOwned && !canAfford)}
                              onClick={isOwned ? () => equipItem(item) : () => buyEquipment(item)}
                              className={`py-1.5 px-2.5 rounded-none text-xs font-mono tracking-wider transition-all min-w-[90px] text-center uppercase cursor-pointer ${
                                isEquipped
                                  ? "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-850 flex items-center justify-center gap-1"
                                  : isOwned
                                    ? "bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600 font-bold"
                                    : canAfford
                                      ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-300 font-bold"
                                      : "bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed"
                              }`}
                            >
                              {isEquipped ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>装備中</span>
                                </>
                              ) : isOwned ? (
                                <span>装備する</span>
                              ) : (
                                <span>{item.cost} G</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ARMORS SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono tracking-widest text-zinc-400 uppercase border-b border-zinc-900 pb-1 flex items-center justify-between">
                      <span>ARMORS // 防護装甲</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase">armor_class</span>
                    </h4>

                    <div className="space-y-2">
                      {EQUIPMENT_ITEMS.filter((item) => item.type === "armor").map((item) => {
                        const isEquipped = player.equippedArmorId === item.id;
                        const isOwned = isDebugMode || player.ownedItemIds.includes(item.id);
                        const canAfford = player.gold >= item.cost;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 border select-none transition-all rounded-none flex items-center justify-between gap-4 ${
                              isEquipped 
                                ? "border-zinc-750 bg-zinc-900/30" 
                                : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-800"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-mono text-zinc-650 block">
                                {isOwned ? "PURCHASED // 所有済み" : `ARMOR // VAL_0${item.cost}`}
                              </span>
                              <h5 className="text-xs font-bold text-zinc-200 mt-0.5">{item.jpName}</h5>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic font-light">{item.description}</p>
                              <div className="flex gap-3 mt-1.5 text-[10px] font-mono">
                                {item.attackBonus > 0 && <span className="text-emerald-400">攻撃 +{item.attackBonus}</span>}
                                {item.magicBonus > 0 && <span className="text-cyan-400">魔力 +{item.magicBonus}</span>}
                                {item.defenseBonus > 0 && <span className="text-amber-400">防御 +{item.defenseBonus}</span>}
                              </div>
                            </div>

                            <button
                              disabled={isEquipped || (!isOwned && !canAfford)}
                              onClick={isOwned ? () => equipItem(item) : () => buyEquipment(item)}
                              className={`py-1.5 px-2.5 rounded-none text-xs font-mono tracking-wider transition-all min-w-[90px] text-center uppercase cursor-pointer ${
                                isEquipped
                                  ? "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-850 flex items-center justify-center gap-1"
                                  : isOwned
                                    ? "bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600 font-bold"
                                    : canAfford
                                      ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-300 font-bold"
                                      : "bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed"
                              }`}
                            >
                              {isEquipped ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>装備中</span>
                                </>
                              ) : isOwned ? (
                                <span>装備する</span>
                              ) : (
                                <span>{item.cost} G</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HELP & COMPENDIUM */}
            {lobbyTab === "help" && (
              <div className="space-y-6" id="help-and-compendium">
                <div className="text-center mb-6">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-blue-400 font-bold uppercase block mb-1 animate-pulse">
                    Tactical Operation Manual // 戦術指南・ヘルプ
                  </span>
                  <h3 className="text-xl font-light text-zinc-100 uppercase tracking-[0.1em]">
                    各システムの詳細と戦闘指南
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto italic font-light">
                    マトリクス戦術戦闘員の生存率を最大化するための基本情報。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* 1. STATUSES AND MEANINGS */}
                  <div className="border border-zinc-900 bg-zinc-950/70 p-5 rounded-none space-y-4">
                    <h4 className="font-mono text-sm font-semibold tracking-wider text-zinc-100 border-b border-zinc-900 pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>01. ステータスとその意味について</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light leading-relaxed">
                      <div className="space-y-1.5 p-3 bg-zinc-900/40 border border-zinc-900/50">
                        <div className="font-bold text-zinc-300 font-mono flex items-center justify-between">
                          <span>HP (体力値)</span>
                          <span className="text-[10px] text-zinc-500">HEALTH_POINTS</span>
                        </div>
                        <p className="text-zinc-400">
                          プレイヤーの生命力。これが 0 になると作戦失敗（敗北）となり、現在挑戦中の連戦で溜まっていた全ての蓄積報酬が完全に消失(ロスト)します。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-zinc-900/40 border border-zinc-900/50">
                        <div className="font-bold text-zinc-300 font-mono flex items-center justify-between">
                          <span>MP (魔力値)</span>
                          <span className="text-[10px] text-zinc-500">MAGIC_POINTS</span>
                        </div>
                        <p className="text-zinc-400">
                          強力な物理スキルや魔導呪文の詠唱（使用）に要求される魔力のエネルギーです。自身の魔力量と相談しながら強力な技を繰り出しましょう。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-zinc-900/40 border border-zinc-900/50">
                        <div className="font-bold text-zinc-300 font-mono flex items-center justify-between">
                          <span>攻撃力 (ATK)</span>
                          <span className="text-[10px] text-zinc-500">PHYSICAL_STRENGTH</span>
                        </div>
                        <p className="text-zinc-400">
                          通常物理攻撃ダメージ、および「二連斬り」「破兜撃」などの物理カテゴリに属する習得スキルの最大攻撃ダメージ威力を補正・増強します。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-zinc-900/40 border border-zinc-900/50">
                        <div className="font-bold text-zinc-300 font-mono flex items-center justify-between">
                          <span>魔力 (MAG)</span>
                          <span className="text-[10px] text-zinc-500">SORCERY_POWER</span>
                        </div>
                        <p className="text-zinc-400">
                          「烈火の球」「迅雷の撃」などの攻撃呪文パワーに加え、「聖なる福音」による回復量、および特殊障壁などの効力を一元的に高める能力値です。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-zinc-900/40 border border-zinc-900/50 md:col-span-2">
                        <div className="font-bold text-zinc-300 font-mono flex items-center justify-between">
                          <span>防御力 (DEF)</span>
                          <span className="text-[10px] text-zinc-500">ARMOR_SHIELDING</span>
                        </div>
                        <p className="text-zinc-400">
                          敵から繰り広げられる様々な攻撃、バースト呪文などの被ダメージ値を強力にシャットアウト・軽減します。防御力の上昇は厳しい連戦での生存率に直結します。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. EQUIPMENT GUIDE */}
                  <div className="border border-zinc-900 bg-zinc-950/70 p-5 rounded-none space-y-3">
                    <h4 className="font-mono text-sm font-semibold tracking-wider text-zinc-100 border-b border-zinc-900 pb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      <span>02. 武具について</span>
                    </h4>
                    <div className="space-y-2 text-xs font-light leading-relaxed text-zinc-400">
                      <p>
                        ・武器を装備することで**物理攻撃力**や**魔導魔力**が上昇します。防具を装備することでプレイヤーの**防御耐性能力値**が飛躍的に守護されます。
                      </p>
                      <p>
                        ・作戦任務中（戦闘時以外）には、いつでも基地の「**GEAR_SHOP // 武具屋**」で貯めたゴールドを用いて、より高度に鍛え上げられた武具を購入し、自動的に即座に装備することができます。
                      </p>
                      <p>
                        ・武具は一度購入すれば永続的にプレイヤーの所有物となります。レベルアップ時にも装備品のステータス増加能力は合計値として適切に上乗せされ、戦闘補正値として正しく作用し続けます。
                      </p>
                    </div>
                  </div>

                  {/* 3. CONSECUTIVE BATTLE SYSTEM */}
                  <div className="border border-zinc-900 bg-zinc-950/70 p-5 rounded-none space-y-4">
                    <h4 className="font-mono text-sm font-semibold tracking-wider text-zinc-100 border-b border-zinc-900 pb-2 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-red-500" />
                      <span>03. 連戦システムについて</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-light leading-relaxed">
                      <div className="space-y-1.5 p-3 bg-red-950/10 border border-red-500/10">
                        <h5 className="font-bold text-red-400 font-mono">🔥 連勝による報酬倍率アップ</h5>
                        <p className="text-zinc-400">
                          討伐完了時、次の標的に休まず連続で挑む「連戦継続」を行うと、討伐累積報酬（EXP、ゴールド）に適用される倍率ボーナスが **最大7.0倍（さらにそれ以上）** へと飛躍的にアップします。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-emerald-950/15 border border-emerald-500/15">
                        <h5 className="font-bold text-emerald-400 font-mono">👑 撤退による安全な報酬回収</h5>
                        <p className="text-zinc-400">
                          戦闘が終了したインターバル時に「**SECURE RETREAT // 撤退して全報酬を獲得**」を選択することで、それまでに蓄積された基本報酬に連勝倍率を掛け合わせた経験値とゴールドを、すべて安全に持ち帰り回収することができます。
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3 bg-zinc-900/60 border border-zinc-850 sm:col-span-2">
                        <h5 className="font-bold text-zinc-300 font-mono">⚠️ 敗北による完全ロストと生還の恩恵</h5>
                        <p className="text-zinc-400">
                          ・連戦中に体力が 0 になり敗北した場合、その作戦内で蓄積されていた全ての獲得予定報酬（経験値・資金）は **完全にロスト（消失）** し、手元に残りません。
                        </p>
                        <p className="text-zinc-400 mt-1">
                          ・ただし、安全に撤退を選択し無事基地へと帰還した際には、過酷な闘いで負った傷が全て癒え、**プレイヤーの体力(HP)および魔力(MP)がすべて最大まで自動的に全回復**する恩恵を得ることが可能です！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEWPORT 2: ACTIVE COMBAT SCREEN */}
        {(gameState === "fighting" || gameState === "consecutive-choice" || gameState === "victory" || gameState === "defeat") && (
          <div className="space-y-3" id="view-combat-arena">
            {/* Visual game stage element (Holds Enemy, floating counters) */}
            <EnemyArt
              enemy={currentEnemy}
              isAttacking={isEnemyAttacking}
              isHit={isEnemyHit}
              isDead={enemyHp <= 0}
              damagePopups={damagePopups}
            />

            {/* Float values on Player HUD directly using AnimatePresence */}
            <div className="relative overflow-visible" id="player-floater-receiver">
              <AnimatePresence>
                {playerPopups.map((popup) => (
                  <motion.div
                    key={popup.id}
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.6, 1.2, 1, 0.9] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="absolute left-3/4 -translate-x-1/2 top-0 pointer-events-none select-none z-50 text-center"
                  >
                    <span className={`font-mono font-bold text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                      popup.type === "damage-player" ? "text-red-500" :
                      popup.type === "heal-player" ? "text-emerald-400" :
                      popup.type === "mp-player" ? "text-cyan-400" : "text-zinc-300"
                    }`}>
                      {popup.value}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Status Gauges (Enemy & Player Health) */}
              <StatusBars
                player={player}
                enemyHp={enemyHp}
                enemyMaxHp={currentEnemy.hp}
              />
            </div>

            {/* Combat action console panel */}
            {gameState === "fighting" && (
              <PlayerControls
                player={player}
                isResolvingTurn={isResolvingTurn}
                onPhysicalAttack={triggerPhysicalAttack}
                onMagicSpell={triggerMagicSpell}
                onDefend={triggerDefense}
              />
            )}

            {gameState === "consecutive-choice" && (
              <div className="bg-zinc-950 border border-zinc-700/80 p-5 font-mono text-xs text-zinc-300 space-y-4" id="consecutive-choice-panel">
                <div className="text-center border-b border-zinc-900 pb-3">
                  <span className="text-[10px] tracking-[0.3em] text-emerald-400 font-bold uppercase block mb-1 animate-pulse">
                    ★ SECTOR CLEAR // 討伐完了 ★
                  </span>
                  <h3 className="text-lg font-light tracking-wide uppercase italic text-zinc-100">
                    連勝実績： {consecutiveWins} 連勝中！
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <div className="bg-zinc-900/50 border border-zinc-900 p-2 text-center">
                    <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-1">現在の蓄積報酬 (基本値)</div>
                    <div className="flex justify-around text-[11px] font-bold">
                      <span className="text-zinc-300">EXP +{accumulatedBaseExp}</span>
                      <span className="text-amber-500">GOLD +{accumulatedBaseGold}G</span>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 text-center flex flex-col justify-center">
                    <div className="text-emerald-400 uppercase tracking-widest text-[9px] font-bold">連勝倍率ボーナス</div>
                    <div className="text-lg font-bold text-emerald-350">
                      × {getConsecutiveMultiplier(consecutiveWins).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/80 border border-zinc-850 flex flex-col sm:flex-row items-center justify-around gap-2 text-center">
                  <div>
                    <div className="text-zinc-500 text-[9px] uppercase tracking-wide">撤退時のお持ち帰り獲得（倍率適用後）</div>
                    <div className="text-sm font-bold text-zinc-100 flex items-center justify-center gap-4 mt-1">
                      <span className="text-emerald-450">+{Math.floor(accumulatedBaseExp * getConsecutiveMultiplier(consecutiveWins))} EXP</span>
                      <span className="text-zinc-700">/</span>
                      <span className="text-amber-400">+{Math.floor(accumulatedBaseGold * getConsecutiveMultiplier(consecutiveWins))} GOLD</span>
                    </div>
                  </div>
                </div>

                {/* Choices Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => continueRun()}
                    className="w-full py-3.5 px-4 text-xs font-bold tracking-widest uppercase cursor-pointer border border-emerald-600 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all flex items-center justify-center gap-2 rounded-none"
                    id="btn-consecutive-continue"
                  >
                    <Swords className="w-4 h-4" />
                    <span>CONTINUE FIGHT // 次の戦闘へ進む</span>
                  </button>

                  <button
                    onClick={() => retreatRun()}
                    className="w-full py-3.5 px-4 text-xs font-bold tracking-widest uppercase cursor-pointer border border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-all flex items-center justify-center gap-2 rounded-none"
                    id="btn-consecutive-retreat"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>SECURE RETREAT // 撤退して全報酬を獲得</span>
                  </button>
                </div>

                <p className="text-[10px] text-zinc-550 text-center leading-relaxed font-light">
                  ※ 連戦を継続すると、現体力を維持したまま、新しいランダムボス（同難度）と遭遇します。<br />
                  ※ そのまま戦闘で力尽きると、上記蓄積報酬（倍率ボーナス含む）はすべて消失します。
                </p>
              </div>
            )}

            {/* Scrollable battle logging window */}
            <LogPanel logs={logs} />
          </div>
        )}
      </main>

      {/* OVERLAY POPUPS: GAME OVER / VICTORY MODALS (Geometric ultra-polished non-rounded cards) */}
      <AnimatePresence>
        {/* Victory End Card Screen */}
        {gameState === "victory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            id="victory-end-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-700 p-8 rounded-none max-w-md w-full text-center relative overflow-hidden"
              id="victory-card-content"
            >
              {/* Corner accent geometric elements */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-zinc-200"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-200"></div>

              <div className="mx-auto w-12 h-12 border border-zinc-700 flex items-center justify-center mb-5 bg-zinc-900" id="victory-badge">
                <Trophy className="w-6 h-6 text-zinc-150 animate-[spin_10s_linear_infinite]" />
              </div>

              <h2 className="text-2xl font-light tracking-[0.25em] text-zinc-100 uppercase italic">
                VICTORY MATRIX
              </h2>
              <p className="text-[10px] text-zinc-550 font-mono uppercase tracking-[0.2em] mt-1.5">
                Target completely subdued // 戦闘終了
              </p>

              <div className="my-6 py-4 px-3 bg-zinc-950 rounded-none border border-zinc-850 flex items-center justify-around font-mono" id="stats-diff-card">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">LEVEL</span>
                  <span className="text-lg font-bold text-zinc-105 font-mono font-mono">0{player.level}</span>
                </div>
                <div className="h-6 w-px bg-zinc-850" />
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">VIT MAX</span>
                  <span className="text-lg font-bold text-zinc-105 font-mono">{player.maxHp}</span>
                </div>
                <div className="h-6 w-px bg-zinc-850" />
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">MP MAX</span>
                  <span className="text-lg font-bold text-zinc-105 font-mono">{player.maxMp}</span>
                </div>
              </div>

              {victoryRewards && (
                <div className="my-5 py-3 px-2 bg-zinc-900/50 border border-zinc-900 flex items-center justify-around font-mono text-center" id="victory-rewards-display">
                  <div>
                    <span className="text-[9px] text-zinc-550 block tracking-widest uppercase">GET EXP // 獲得経験値</span>
                    <span className="text-sm font-bold text-emerald-450 font-mono">+{victoryRewards.exp} EXP</span>
                  </div>
                  <div className="h-6 w-px bg-zinc-850" />
                  <div>
                    <span className="text-[9px] text-zinc-550 block tracking-widest uppercase">GET GOLD // 獲得資金</span>
                    <span className="text-sm font-bold text-amber-500 font-mono">+{victoryRewards.gold} G</span>
                  </div>
                </div>
              )}

              {consecutiveWins > 0 && (
                <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase mt-4 mb-2 animate-pulse bg-emerald-950/20 py-1.5 border border-emerald-500/10">
                  🔥 {consecutiveWins}連戦勝利達成 (倍率ボーナス: {getConsecutiveMultiplier(consecutiveWins).toFixed(2)}倍適用)
                </div>
              )}

              <p className="text-xs text-zinc-400 leading-relaxed font-light mt-4">
                おめでとうございます！ <strong>{currentRunDifficulty}難度</strong> の連続作戦から無事に『撤退・帰還』を完了しました。経験値とゴールドを基地へ安全に持ち帰ることに成功しました！
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3" id="victory-action-row">
                <button
                  onClick={restartGame}
                  className="flex-1 py-3 px-4 rounded-none bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold hover:scale-[1.01] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest"
                  id="victory-btn-restart"
                >
                  <Award className="w-4 h-4" />
                  <span>Next Assignment // 次の戦闘へ</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Defeat End Card Screen */}
        {gameState === "defeat" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/90 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            id="defeat-end-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 p-8 rounded-none max-w-md w-full text-center relative overflow-hidden"
              id="defeat-card-content"
            >
              {/* Corner accent geometric elements */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-red-600"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-650"></div>

              <div className="mx-auto w-12 h-12 border border-zinc-800 flex items-center justify-center mb-5 bg-zinc-900" id="defeat-badge">
                <Skull className="w-6 h-6 text-red-500 animate-pulse" />
              </div>

              <h2 className="text-2xl font-light tracking-[0.25em] text-red-500 uppercase italic">
                DEFEATED_
              </h2>
              <p className="text-[10px] text-zinc-550 font-mono uppercase tracking-[0.2em] mt-1.5">
                Life Force Depleted // 無念
              </p>

              <p className="text-xs text-zinc-400 font-light leading-relaxed my-6">
                無念！ <strong>{currentEnemy.name}</strong> の強力な一撃の前に力尽きてしまいました。戦闘をリセットして再挑戦するか、別の敵に戦術を磨いて挑みましょう。
              </p>

              <div className="flex flex-col sm:flex-row gap-3" id="defeat-action-row">
                <button
                  onClick={restartGame}
                  className="flex-1 py-3 px-4 rounded-none bg-red-900 hover:bg-red-800 text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest"
                  id="defeat-btn-restart"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return to Map // 再点検</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retro aesthetic footnote info */}
      <footer className="text-center text-[9px] text-zinc-650 font-mono mt-8 uppercase tracking-[0.25em]" id="rpg-credit-footer">
        COMMAND_BATTLE_STATION_T_104 // HOST:_ONLINE // 2026_06_10
      </footer>
    </div>
  );
}
