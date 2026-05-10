"use client";

import Image from "next/image";
import { useState } from "react";

interface ChampionIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Data Dragon からチャンピオンアイコンを表示するコンポーネント。
 * 読み込み失敗時はイニシャルフォールバックを表示する。
 */
export function ChampionIcon({ name, size = 40, className = "" }: ChampionIconProps) {
  const [error, setError] = useState(false);

  // Data Dragon は名前に特殊ルールがある (例: "Wukong" → "MonkeyKing")
  const iconName = CHAMPION_NAME_MAP[name] ?? name.replace(/[' ]/g, "");
  const src = `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${iconName}.png`;

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-secondary text-xs font-bold ${className}`}
        style={{ width: size, height: size }}
        title={name}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full border-2 border-[oklch(0.4_0.08_85/0.6)] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

/** Riot API のチャンピオン名と Data Dragon のファイル名が異なるケース */
const CHAMPION_NAME_MAP: Record<string, string> = {
  "Wukong": "MonkeyKing",
  "Renata Glasc": "Renata",
  "Nunu & Willump": "Nunu",
  "Jarvan IV": "JarvanIV",
  "Aurelion Sol": "AurelionSol",
  "Bel'Veth": "Belveth",
  "Cho'Gath": "Chogath",
  "Dr. Mundo": "DrMundo",
  "Kog'Maw": "KogMaw",
  "K'Sante": "KSante",
  "Lee Sin": "LeeSin",
  "Master Yi": "MasterYi",
  "Miss Fortune": "MissFortune",
  "Rek'Sai": "RekSai",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Vel'Koz": "Velkoz",
  "Xin Zhao": "XinZhao",
};
