// ─── MySocial.mom Constants ──────────────────────────────────────────────────

export const THRYX_API = "https://thryx.mom";

export const THRYX_TOKEN = "0xc07E889e1816De2708BF718683e52150C20F3BA3";
export const WETH_BASE = "0x4200000000000000000000000000000000000006";
export const THRYX_POOL = "0xBdAF455Adcd7F1AAA1B25C8D4182c935F93ebA0A";
export const TREASURY_WALLET = "0x7a3E312Ec6e20a9F62fE2405938EB9060312E334";

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = "0x2105";

// Default "Tom" friend — the project owner, everyone's first friend
export const DEFAULT_FRIEND = {
  address: "0x7a3e312ec6e20a9f62fe2405938eb9060312e334",
  name: "Tom (THRYX)",
  avatar: "/tom.jpg",
};

// Moods list
export const MOODS = [
  { emoji: "😊", label: "happy" },
  { emoji: "😢", label: "sad" },
  { emoji: "😡", label: "angry" },
  { emoji: "😴", label: "tired" },
  { emoji: "🤩", label: "excited" },
  { emoji: "😎", label: "chill" },
  { emoji: "🤔", label: "thoughtful" },
  { emoji: "😂", label: "amused" },
  { emoji: "🥰", label: "loved" },
  { emoji: "😤", label: "frustrated" },
  { emoji: "🎉", label: "celebratory" },
  { emoji: "💀", label: "dead" },
  { emoji: "🔥", label: "on fire" },
  { emoji: "❄️", label: "cold" },
  { emoji: "🤗", label: "grateful" },
  { emoji: "😏", label: "devious" },
] as const;

// Default avatar
export const DEFAULT_AVATAR = "/default-avatar.svg";
