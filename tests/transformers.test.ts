import { describe, it, expect } from "vitest";
import matchSample from "./fixtures/match-sample.json";
import timelineSample from "./fixtures/timeline-sample.json";
import { transformMatch, findMe } from "../src/lib/transformers/match";
import { extractPatch } from "../src/lib/utils/patch";

const MY_PUUID =
  "puuid-me-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("extractPatch", () => {
  it("14.21.123.4567 → 14.21", () => {
    expect(extractPatch("14.21.123.4567")).toBe("14.21");
  });

  it("バージョン文字列が短い場合もそのまま返す", () => {
    expect(extractPatch("14.21")).toBe("14.21");
  });
});

describe("findMe", () => {
  it("自分の PUUID に一致する参加者を返す", () => {
    const me = findMe(matchSample.info.participants as never, MY_PUUID);
    expect(me).toBeDefined();
    expect(me?.championName).toBe("Jinx");
  });

  it("存在しない PUUID の場合は undefined を返す", () => {
    const me = findMe(matchSample.info.participants as never, "nonexistent");
    expect(me).toBeUndefined();
  });
});

describe("transformMatch", () => {
  it("マッチ情報を正しく変換する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    expect(result.match.matchId).toBe("JP1_1234567890");
    expect(result.match.patch).toBe("14.21");
    expect(result.match.win).toBe(1);
    expect(result.match.queueId).toBe(420);
  });

  it("自分のパフォーマンスを正しく抽出する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    const perf = result.myPerformance;
    expect(perf.championName).toBe("Jinx");
    expect(perf.kills).toBe(8);
    expect(perf.deaths).toBe(3);
    expect(perf.assists).toBe(5);
    expect(perf.csTotal).toBe(182); // 180 + 2
    expect(perf.role).toBe("BOTTOM");
    expect(perf.teamId).toBe(100);
  });

  it("対面情報 (Caitlyn) を正しく抽出する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    expect(result.matchup).not.toBeNull();
    expect(result.matchup?.oppChampionName).toBe("Caitlyn");
    expect(result.matchup?.oppKills).toBe(4);
    expect(result.matchup?.oppDeaths).toBe(8);
  });

  it("@15分のスタッツを正しく抽出する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    // フレームの timestamp が 900000 以上の最初のフレーム
    const perf = result.myPerformance;
    expect(perf.csAt15).toBe(70); // minionsKilled(68) + jungleMinionsKilled(2) at 900s frame
    expect(perf.goldAt15).toBe(4200);

    // タイムラインでCaitlynはindex 1 = participantId 2: minions(20)+jungle(85)=105
    const mu = result.matchup!;
    expect(mu.oppCsAt15).toBe(105);
    expect(mu.csDiffAt15).toBe(70 - 105); // -35
  });

  it("スキル順を正しく抽出する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    expect(result.skillOrder.length).toBeGreaterThan(0);
    expect(result.skillOrder[0]).toMatchObject({
      matchId: "JP1_1234567890",
      level: 1,
      skillSlot: 1,
    });
  });

  it("ビルドイベントを正しく抽出する", () => {
    const result = transformMatch(
      matchSample as never,
      timelineSample as never,
      MY_PUUID
    );

    expect(result.buildEvents.length).toBe(1);
    expect(result.buildEvents[0]).toMatchObject({
      matchId: "JP1_1234567890",
      itemId: 1055,
      eventType: "ITEM_PURCHASED",
    });
  });
});
