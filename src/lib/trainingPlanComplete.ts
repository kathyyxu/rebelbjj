import { format } from "date-fns";
import { AppLocale } from "@/lib/locale";
import { estimatePlanSessionMinutes, TrainingPlanResult } from "@/lib/trainingPlanEngine";
import {
  getTodayDateKey,
  getTodayPlanRecords,
  markTrainingPlanRecordCompleted,
  TrainingPlanRecord,
} from "@/lib/trainingPlanHistory";
import {
  buildTrainingLogEntry,
  readTrainingLogs,
  saveTrainingLogs,
  TrainingCategory,
  TrainingLogEntry,
  TrainingLogDraft,
} from "@/lib/trainingLogs";
import type { MenstrualPhase } from "@/lib/trainingLogs";
import { RecentFeeling, UserProfile } from "@/lib/userProfile";

export const AI_PLAN_LOG_MARKER = "[AI教练训练方案]";
const AI_PLAN_LOG_MARKER_LEGACY = "[AI训练方案]";

const inferCategories = (profile: UserProfile): TrainingCategory[] => {
  if (profile.belt === "white") return ["逃脱"];
  if (profile.goal === "competition") return ["扫技", "过腿"];
  if (profile.goal === "fat-loss") return ["防守", "位置控制"];
  if (profile.goal === "recovery" || profile.goal === "health") return ["位置控制"];
  return ["位置控制", "扫技"];
};

const feelingFromProfile = (profile: UserProfile, locale: AppLocale): string => {
  const feeling = profile.recentFeeling;
  if (!feeling) return "";

  const map: Record<RecentFeeling, Record<AppLocale, string>> = {
    energetic: {
      "zh-CN": "精力好",
      "zh-TW": "精力好",
      en: "Feeling good",
      ja: "好調",
    },
    normal: {
      "zh-CN": "状态一般",
      "zh-TW": "狀態一般",
      en: "Doing okay",
      ja: "普通",
    },
    tired: {
      "zh-CN": "疲惫",
      "zh-TW": "疲憊",
      en: "Tired",
      ja: "疲れ気味",
    },
  };

  return map[feeling][locale] ?? map[feeling]["zh-CN"];
};

const buildPlanNotes = (plan: TrainingPlanResult, planRecordId?: string) => {
  const sections = [plan.warmup, plan.technique, plan.conditioning, plan.cooldown];
  const lines = [
    AI_PLAN_LOG_MARKER,
    planRecordId ? `plan:${planRecordId}` : "",
    plan.opening,
    "",
    ...plan.personalization.items,
    "",
    ...sections.flatMap((section) => [
      `【${section.title}${section.durationLabel ? ` · ${section.durationLabel}` : ""}】`,
      ...section.items.map((item) => `· ${item}`),
      "",
    ]),
  ].filter(Boolean);

  return lines.join("\n").trim();
};

export const findTodayAiPlanLog = (logs: TrainingLogEntry[]) => {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    logs.find(
      (entry) =>
        entry.date === today &&
        (entry.notes.includes(AI_PLAN_LOG_MARKER) ||
          entry.notes.includes(AI_PLAN_LOG_MARKER_LEGACY)),
    ) ?? null
  );
};

export const buildTrainingLogDraftFromPlan = (
  plan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  durationMinutes: number,
  planRecordId?: string,
): TrainingLogDraft => {
  const techniqueLines = [
    plan.technique.title,
    ...plan.technique.items,
    ...plan.warmup.items.slice(0, 2),
  ];

  return {
    date: format(new Date(), "yyyy-MM-dd"),
    durationMinutes: String(durationMinutes),
    location: "",
    sessionType: "自练",
    uniformType: "GI",
    menstrualPhase:
      profile.gender === "female" && profile.menstrualPhase
        ? profile.menstrualPhase
        : ("卵泡期" as MenstrualPhase),
    coach: "",
    techniquesInput: techniqueLines.join(", "),
    categories: inferCategories(profile),
    identities: ["自由滚"],
    focus: plan.summary,
    notes: buildPlanNotes(plan, planRecordId),
    feeling: feelingFromProfile(profile, locale),
    summary: `${plan.headline} · ${plan.intensity}`,
  };
};

export type CompleteTrainingPlanResult = {
  log: TrainingLogEntry;
  planRecordId: string;
  isUpdate: boolean;
};

export const completeTrainingPlanSession = (
  plan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  planRecord: TrainingPlanRecord,
  scope?: string | null,
): CompleteTrainingPlanResult => {
  const durationMinutes = estimatePlanSessionMinutes(profile, plan.difficultyOffset);
  const draft = buildTrainingLogDraftFromPlan(
    plan,
    profile,
    locale,
    durationMinutes,
    planRecord.id,
  );

  const existingLogs = readTrainingLogs(scope);
  const existingTodayLog = findTodayAiPlanLog(existingLogs);
  const log = buildTrainingLogEntry(draft, existingTodayLog?.id);

  const nextLogs = existingTodayLog
    ? existingLogs.map((entry) => (entry.id === existingTodayLog.id ? log : entry))
    : [log, ...existingLogs];

  saveTrainingLogs(nextLogs, scope);
  markTrainingPlanRecordCompleted(planRecord.id, log.id, scope);

  return {
    log,
    planRecordId: planRecord.id,
    isUpdate: !!existingTodayLog,
  };
};

/** 仅当指定方案存档（默认取今天最新一条）已点过「完成」时返回状态 */
export const getTodayPlanCompletion = (
  scope?: string | null,
  planRecordId?: string | null,
) => {
  const todayRecords = getTodayPlanRecords(scope);
  if (!todayRecords.length) return null;

  const record = planRecordId
    ? todayRecords.find((item) => item.id === planRecordId) ?? null
    : todayRecords[0] ?? null;

  if (!record?.completedAt || !record.trainingLogId) return null;

  return {
    logId: record.trainingLogId,
    recordId: record.id,
    completedAt: record.completedAt,
  };
};

export const isPlanRecordFromToday = (record: TrainingPlanRecord) =>
  getTodayDateKey(record.createdAt) === getTodayDateKey();