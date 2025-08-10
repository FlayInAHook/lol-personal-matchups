import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Types matching a subset of DDragon's champion schema
export type ChampionInfo = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type ChampionImage = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Champion = {
  version: string; // e.g., "15.15.1"
  id: string; // e.g., "Aatrox"
  key: string; // numeric as string, e.g., "266"
  name: string;
  title: string;
  blurb: string;
  info: ChampionInfo;
  image: ChampionImage;
  tags: string[]; // e.g., ["Fighter", "Tank"]
  partype: string;
  stats: Record<string, number>;
};

type ChampionsResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, Champion>;
};

const versionsUrl = "https://ddragon.leagueoflegends.com/api/versions.json";

export const latestVersionAtom = atom(async () => {
  const res = await fetch(versionsUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch versions: ${res.status}`);
  const versions = (await res.json()) as string[];
  if (!Array.isArray(versions) || versions.length === 0)
    throw new Error("No versions returned from ddragon");
  return versions[0];
});

export const championsAtom = atom(async (get) => {
  const version = await get(latestVersionAtom);
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch champions: ${res.status}`);
  const json = (await res.json()) as ChampionsResponse;
  const list = Object.values(json.data);
  // Sort alphabetically by name for stable display
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
});

// UI atoms
export const searchAtom = atom("");

// Persisted selection for "your champions" (multi-select)
export const myChampsAtom = atomWithStorage<string[]>(
  "my_champions",
  [],
);

// Non-persisted selection for opponent (single value id)
export const opponentChampAtom = atom<string>("");

// Lane/Role selection (persisted)
export type LaneValue = "top" | "jungle" | "middle" | "bottom" | "support";
export const laneAtom = atomWithStorage<LaneValue | "">("lane", "");

// Result storage for Lolalytics extraction per champ id
export type LolalyticsMatchup = {
  summary: string;
  games?: number;
};
export const lolalyticsResultsAtom = atom<Record<string, LolalyticsMatchup>>({});

// Helper to map champion id to slug for lolalytics
export function championSlug(id: string): string {
  const v = id.toLowerCase();
  return v === "monkeyking" ? "wukong" : v;
}

// Tier selection for Lolalytics queries
export type TierValue =
  | "all"
  | "1trick"
  | "challenger"
  | "grandmaster"
  | "grandmaster_plus"
  | "master"
  | "master_plus"
  | "diamond"
  | "d2_plus"
  | "diamond_plus"
  | "emerald"
  | "emerald_plus"
  | "platinum"
  | "platinum_plus"
  | "gold"
  | "gold_plus"
  | "silver"
  | "bronze"
  | "iron"
  | "unranked";
export const tierAtom = atomWithStorage<TierValue>("tier", "diamond_plus");
