import { FIFTEEN_MINUTES_MS, POSITION_TO_ROLE } from "../utils/constants";
import { extractPatch } from "../utils/patch";
import type { MatchData, Participant, TimelineData } from "../riot/types";
import type {
  BuildEventRow,
  MatchRow,
  MatchupRow,
  MyPerformanceRow,
  SkillOrderRow,
} from "../db/schema";

export interface TransformResult {
  match: MatchRow;
  myPerformance: MyPerformanceRow;
  matchup: MatchupRow | null;
  buildEvents: BuildEventRow[];
  skillOrder: SkillOrderRow[];
}

/**
 * Riot API のマッチデータとタイムラインを DB 行形式に変換する。
 * @param matchData Match-V5 API レスポンス
 * @param timelineData Timeline-V5 API レスポンス
 * @param myPuuid 自分の PUUID
 */
export function transformMatch(
  matchData: MatchData,
  timelineData: TimelineData,
  myPuuid: string
): TransformResult {
  const { info } = matchData;
  const matchId = matchData.metadata.matchId;

  const me = info.participants.find((p) => p.puuid === myPuuid);
  if (!me) {
    throw new Error(`My PUUID not found in match ${matchId}`);
  }

  // 対面(同レーン、相手チーム)を探す
  const myRole = normalizeRole(me.teamPosition);
  const opponent = info.participants.find(
    (p) => p.teamId !== me.teamId && normalizeRole(p.teamPosition) === myRole
  );

  // タイムラインから各種@15分スタッツを取得
  const myParticipantId = getParticipantId(timelineData, myPuuid);
  const oppParticipantId = opponent
    ? getParticipantId(timelineData, opponent.puuid)
    : null;

  const at15Frame = getFrameAt15(timelineData);

  const myAt15 = at15Frame
    ? at15Frame.participantFrames[String(myParticipantId)]
    : null;
  const oppAt15 =
    at15Frame && oppParticipantId
      ? at15Frame.participantFrames[String(oppParticipantId)]
      : null;

  const myCs15 = myAt15
    ? myAt15.minionsKilled + myAt15.jungleMinionsKilled
    : null;
  const oppCs15 = oppAt15
    ? oppAt15.minionsKilled + oppAt15.jungleMinionsKilled
    : null;

  // ビルドイベントとスキル順を抽出
  const buildEvents = extractBuildEvents(timelineData, myParticipantId, matchId);
  const skillOrder = extractSkillOrder(timelineData, myParticipantId, matchId);

  const match: MatchRow = {
    matchId,
    gameCreation: info.gameCreation,
    gameDuration: info.gameDuration,
    gameVersion: info.gameVersion,
    patch: extractPatch(info.gameVersion),
    queueId: info.queueId,
    win: me.win ? 1 : 0,
    createdAt: Date.now(),
  };

  const myPerformance: MyPerformanceRow = {
    matchId,
    championId: me.championId,
    championName: me.championName,
    role: myRole as MyPerformanceRow["role"],
    teamId: me.teamId as 100 | 200,
    kills: me.kills,
    deaths: me.deaths,
    assists: me.assists,
    csTotal: me.totalMinionsKilled + me.neutralMinionsKilled,
    goldTotal: me.goldEarned,
    damageToChampions: me.totalDamageDealtToChampions,
    visionScore: me.visionScore,
    csAt15: myCs15,
    goldAt15: myAt15?.totalGold ?? null,
    levelAt15: myAt15?.level ?? null,
    xpAt15: myAt15?.xp ?? null,
  };

  const matchupRow: MatchupRow | null = opponent
    ? {
        matchId,
        opponentPuuid: opponent.puuid,
        oppChampionId: opponent.championId,
        oppChampionName: opponent.championName,
        oppKills: opponent.kills,
        oppDeaths: opponent.deaths,
        oppAssists: opponent.assists,
        oppCsTotal: opponent.totalMinionsKilled + opponent.neutralMinionsKilled,
        oppGoldTotal: opponent.goldEarned,
        oppDamageToChampions: opponent.totalDamageDealtToChampions,
        oppCsAt15: oppCs15,
        oppGoldAt15: oppAt15?.totalGold ?? null,
        oppLevelAt15: oppAt15?.level ?? null,
        csDiffAt15:
          myCs15 != null && oppCs15 != null ? myCs15 - oppCs15 : null,
        goldDiffAt15:
          myAt15?.totalGold != null && oppAt15?.totalGold != null
            ? myAt15.totalGold - oppAt15.totalGold
            : null,
      }
    : null;

  return { match, myPerformance, matchup: matchupRow, buildEvents, skillOrder };
}

function normalizeRole(teamPosition: string): string {
  return POSITION_TO_ROLE[teamPosition] ?? (teamPosition || "MIDDLE");
}

function getParticipantId(timeline: TimelineData, puuid: string): number {
  const idx = timeline.info.participants.indexOf(puuid);
  if (idx === -1) {
    throw new Error(`PUUID ${puuid} not found in timeline participants`);
  }
  // Timeline の participantId は 1 始まり
  return idx + 1;
}

function getFrameAt15(timeline: TimelineData) {
  // @15分に最も近いフレームを返す (1分刻みなので index 15)
  return (
    timeline.info.frames.find(
      (f) => f.timestamp >= FIFTEEN_MINUTES_MS
    ) ?? null
  );
}

function extractBuildEvents(
  timeline: TimelineData,
  participantId: number,
  matchId: string
): BuildEventRow[] {
  const events: BuildEventRow[] = [];

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (
        event.participantId === participantId &&
        event.itemId != null &&
        isItemEvent(event.type)
      ) {
        events.push({
          matchId,
          timestampMs: event.timestamp,
          itemId: event.itemId,
          eventType: event.type as BuildEventRow["eventType"],
        });
      }
    }
  }

  return events;
}

function extractSkillOrder(
  timeline: TimelineData,
  participantId: number,
  matchId: string
): SkillOrderRow[] {
  const orders: SkillOrderRow[] = [];
  let level = 0;

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (
        event.type === "SKILL_LEVEL_UP" &&
        event.participantId === participantId &&
        event.skillSlot != null &&
        event.levelUpType === "NORMAL"
      ) {
        level++;
        orders.push({
          matchId,
          level,
          skillSlot: event.skillSlot as 1 | 2 | 3 | 4,
        });
      }
    }
  }

  return orders;
}

function isItemEvent(type: string): boolean {
  return ["ITEM_PURCHASED", "ITEM_SOLD", "ITEM_UNDO", "ITEM_DESTROYED"].includes(
    type
  );
}

/** 自分に相当する Participant を返す (テスト用にエクスポート) */
export function findMe(participants: Participant[], myPuuid: string) {
  return participants.find((p) => p.puuid === myPuuid);
}
