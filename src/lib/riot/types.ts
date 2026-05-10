import { z } from "zod";

// ---------------------------------------------------------------------------
// Account-V1
// ---------------------------------------------------------------------------

export const RiotAccountSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  tagLine: z.string(),
});

export type RiotAccount = z.infer<typeof RiotAccountSchema>;

// ---------------------------------------------------------------------------
// Match-V5 共通
// ---------------------------------------------------------------------------

const ParticipantSchema = z.object({
  puuid: z.string(),
  participantId: z.number(),
  championId: z.number(),
  championName: z.string(),
  teamId: z.number(),
  teamPosition: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  totalMinionsKilled: z.number(),
  neutralMinionsKilled: z.number(),
  goldEarned: z.number(),
  totalDamageDealtToChampions: z.number(),
  visionScore: z.number(),
  win: z.boolean(),
  perks: z
    .object({
      styles: z.array(
        z.object({
          description: z.string(),
          selections: z.array(
            z.object({
              perk: z.number(),
              var1: z.number(),
              var2: z.number(),
              var3: z.number(),
            })
          ),
          style: z.number(),
        })
      ),
    })
    .optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const MatchDataSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()),
  }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(),
    gameVersion: z.string(),
    queueId: z.number(),
    participants: z.array(ParticipantSchema),
  }),
});

export type MatchData = z.infer<typeof MatchDataSchema>;

// ---------------------------------------------------------------------------
// Timeline-V5
// ---------------------------------------------------------------------------

const TimelineFrameEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  participantId: z.number().optional(),
  itemId: z.number().optional(),
  skillSlot: z.number().optional(),
  levelUpType: z.string().optional(),
  // アイテムイベント以外の余分なフィールドは無視
});

export type TimelineFrameEvent = z.infer<typeof TimelineFrameEventSchema>;

const ParticipantFrameSchema = z.object({
  participantId: z.number(),
  totalGold: z.number(),
  level: z.number(),
  xp: z.number(),
  minionsKilled: z.number(),
  jungleMinionsKilled: z.number(),
});

export type ParticipantFrame = z.infer<typeof ParticipantFrameSchema>;

const TimelineFrameSchema = z.object({
  timestamp: z.number(),
  participantFrames: z.record(z.string(), ParticipantFrameSchema),
  events: z.array(TimelineFrameEventSchema),
});

export const TimelineDataSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
  }),
  info: z.object({
    participants: z.array(z.string()),
    frames: z.array(TimelineFrameSchema),
  }),
});

export type TimelineData = z.infer<typeof TimelineDataSchema>;
