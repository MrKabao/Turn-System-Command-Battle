export interface EquipmentItem {
  id: string;
  name: string;
  jpName: string;
  description: string;
  type: "weapon" | "armor";
  cost: number;
  attackBonus: number;
  magicBonus: number;
  defenseBonus: number;
}

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  // --- WEAPONS ---
  {
    id: "bronze_dagger",
    name: "Bronze Dagger",
    jpName: "青銅の短剣",
    description: "安価だが鋭い刃。手軽に攻撃力を高められる初心者の武器。",
    type: "weapon",
    cost: 80,
    attackBonus: 6,
    magicBonus: 0,
    defenseBonus: 0,
  },
  {
    id: "aether_wand",
    name: "Aether Wand",
    jpName: "エーテルの杖",
    description: "魔導水晶が組み込まれた杖。呪文威力が大きく増加する。",
    type: "weapon",
    cost: 150,
    attackBonus: 3,
    magicBonus: 12,
    defenseBonus: 0,
  },
  {
    id: "steel_greatsword",
    name: "Steel Greatsword",
    jpName: "鋼鉄の大剣",
    description: "重量感のある頑丈な両手剣。物理破壊力に特化している。",
    type: "weapon",
    cost: 280,
    attackBonus: 18,
    magicBonus: 0,
    defenseBonus: 2,
  },
  {
    id: "celestial_wand",
    name: "Celestial Wand",
    jpName: "天輝の魔導書",
    description: "失われた古代の英知を秘めた魔導書。莫大な魔力をプレイヤーに宿す。",
    type: "weapon",
    cost: 450,
    attackBonus: 6,
    magicBonus: 28,
    defenseBonus: 0,
  },
  {
    id: "asylum_blade",
    name: "Asylum Dark Blade",
    jpName: "暗黒魔剣アサイラム",
    description: "冥界の闇エネルギーを宿した魔剣。物理と魔法の両方を極限まで高める。",
    type: "weapon",
    cost: 666,
    attackBonus: 35,
    magicBonus: 20,
    defenseBonus: 5,
  },

  // --- ARMORS ---
  {
    id: "leather_vest",
    name: "Leather Vest",
    jpName: "旅人の皮ベスト",
    description: "なめし皮で作られた頑丈なベスト。動きやすさに優れる。",
    type: "armor",
    cost: 60,
    attackBonus: 0,
    magicBonus: 0,
    defenseBonus: 4,
  },
  {
    id: "iron_plate",
    name: "Iron Plate Mail",
    jpName: "鉄のプレートメイル",
    description: "分厚い鉄板で作られた鎧。重い一撃から身をしっかり守る。",
    type: "armor",
    cost: 160,
    attackBonus: 0,
    magicBonus: 0,
    defenseBonus: 12,
  },
  {
    id: "sage_cloak",
    name: "Scholar & Sage Cloak",
    jpName: "賢者の羽織り",
    description: "上質な布に魔術防御の魔法が呪い込まれた、軽量で神秘的な外套。",
    type: "armor",
    cost: 240,
    attackBonus: 0,
    magicBonus: 8,
    defenseBonus: 8,
  },
  {
    id: "dragon_scale",
    name: "Onyx Dragon Scale Mail",
    jpName: "古代竜の鱗鎧",
    description: "古代守護竜の強固な鱗を加工した防具。比類なき盾となる伝説の鎧。",
    type: "armor",
    cost: 480,
    attackBonus: 5,
    magicBonus: 10,
    defenseBonus: 24,
  },
];
