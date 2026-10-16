import { create } from "zustand";

/** Scroll progress lives in a mutable object (read every frame by the 3D scene).
 *  It is the single source of truth for the film timeline. */
export const timeline = { progress: 0 };

export const CHAPTERS = [
  { id: "intro", title: "Money, Reimagined", start: 0 },
  { id: "wallets", title: "Wallets", start: 0.14 },
  { id: "transaction", title: "The Transaction", start: 0.3 },
  { id: "network", title: "The Network", start: 0.44 },
  { id: "block", title: "Mining a Block", start: 0.58 },
  { id: "chain", title: "The Blockchain", start: 0.72 },
  { id: "hash", title: "Hash Lab", start: 0.86 },
  { id: "challenge", title: "Final Challenge", start: 0.94 },
] as const;

export function chapterFor(p: number) {
  let idx = 0;
  CHAPTERS.forEach((c, i) => {
    if (p >= c.start) idx = i;
  });
  return idx;
}

export const BADGES = {
  wallet: "Wallet Explorer",
  block: "First Block Created",
  hash: "Hash Detective",
  guardian: "Blockchain Guardian",
  explorer: "Crypto Explorer",
} as const;
export type BadgeId = keyof typeof BADGES;

interface GameState {
  chapter: number;
  visited: number[];
  xp: number;
  badges: BadgeId[];
  toast: string | null;
  setChapter: (i: number) => void;
  addXp: (n: number) => void;
  award: (b: BadgeId) => void;
  clearToast: () => void;
  reset: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  chapter: 0,
  visited: [0],
  xp: 0,
  badges: [],
  toast: null,
  setChapter: (i) => {
    const s = get();
    if (s.chapter === i) return;
    const isNew = !s.visited.includes(i);
    set({
      chapter: i,
      visited: isNew ? [...s.visited, i] : s.visited,
      xp: isNew ? s.xp + 10 : s.xp,
    });
    if (i === 1) get().award("wallet");
    if (i === 5) get().award("block");
  },
  addXp: (n) => set((s) => ({ xp: s.xp + n })),
  award: (b) => {
    if (get().badges.includes(b)) return;
    set((s) => ({ badges: [...s.badges, b], xp: s.xp + 25, toast: `Badge unlocked · ${BADGES[b]}` }));
  },
  clearToast: () => set({ toast: null }),
  reset: () => set({ chapter: 0, visited: [0], xp: 0, badges: [], toast: null }),
}));
