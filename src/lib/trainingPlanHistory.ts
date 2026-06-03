import { AppLocale } from "@/lib/locale";
import { PlanDifficultyOffset, TrainingPlanResult } from "@/lib/trainingPlanEngine";
import {
  readScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/storage";
import { MenstrualPhase } from "@/lib/trainingLogs";
import { AgeRange, BeltLevel, TrainingGoal, UserProfile } from "@/lib/userProfile";

export const TRAINING_PLAN_HISTORY_STORAGE_KEY = "bjj-rebel-training-plan-history-v1";
export const TRAINING_PLAN_DIFFICULTY_STORAGE_KEY = "bjj-rebel-training-plan-difficulty-v1";
const MAX_RECORDS = 40;

export type TrainingPlanRecord = {
  id: string;
  createdAt: number;
  locale: AppLocale;
  plan: TrainingPlanResult;
  profileSnapshot: {
    ageRange: AgeRange;
    belt: BeltLevel;
    goal: TrainingGoal;
    weeklyFrequency: UserProfile["weeklyFrequency"];
    recentFeeling?: UserProfile["recentFeeling"];
    menstrualPhase?: MenstrualPhase;
  };
  difficultyOffset: PlanDifficultyOffset;
  completedAt?: number;
  trainingLogId?: string;
};

export const buildProfileSnapshot = (profile: UserProfile) => ({
  ageRange: profile.ageRange,
  belt: profile.belt,
  goal: profile.goal,
  weeklyFrequency: profile.weeklyFrequency,
  recentFeeling: profile.recentFeeling,
  menstrualPhase: profile.menstrualPhase,
});

export const readTrainingPlanHistory = (scope?: string | null): TrainingPlanRecord[] => {
  const raw = readScopedStorageItem(TRAINING_PLAN_HISTORY_STORAGE_KEY, scope);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is TrainingPlanRecord =>
          !!item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.createdAt === "number" &&
          item.plan &&
          typeof item.plan === "object",
      )
      .map((item) => {
        const legacyReminders = (item.plan as { reminders?: string[] }).reminders;
        return {
          ...item,
          difficultyOffset: item.difficultyOffset ?? item.plan?.difficultyOffset ?? 0,
          plan: {
            ...item.plan,
            personalization: item.plan.personalization ?? {
              title: "Plan notes",
              items: legacyReminders?.length ? legacyReminders : [],
            },
          },
        } as TrainingPlanRecord;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

export const saveTrainingPlanHistory = (
  records: TrainingPlanRecord[],
  scope?: string | null,
) => {
  writeScopedStorageItem(
    TRAINING_PLAN_HISTORY_STORAGE_KEY,
    JSON.stringify(records.slice(0, MAX_RECORDS)),
    scope,
  );
};

export const readDifficultyOffset = (scope?: string | null): PlanDifficultyOffset => {
  const raw = readScopedStorageItem(TRAINING_PLAN_DIFFICULTY_STORAGE_KEY, scope);
  const parsed = Number(raw);
  if (parsed === -2 || parsed === -1 || parsed === 0 || parsed === 1 || parsed === 2) {
    return parsed;
  }
  return 0;
};

export const saveDifficultyOffset = (offset: PlanDifficultyOffset, scope?: string | null) => {
  writeScopedStorageItem(TRAINING_PLAN_DIFFICULTY_STORAGE_KEY, String(offset), scope);
};

export const appendTrainingPlanRecord = (
  plan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  scope?: string | null,
): TrainingPlanRecord => {
  const record: TrainingPlanRecord = {
    id: `plan-${crypto.randomUUID()}`,
    createdAt: Date.now(),
    locale,
    plan,
    profileSnapshot: buildProfileSnapshot(profile),
    difficultyOffset: plan.difficultyOffset,
  };

  const existing = readTrainingPlanHistory(scope);
  saveTrainingPlanHistory([record, ...existing], scope);
  return record;
};

export const deleteTrainingPlanRecord = (id: string, scope?: string | null) => {
  const next = readTrainingPlanHistory(scope).filter((record) => record.id !== id);
  saveTrainingPlanHistory(next, scope);
};

export const getTodayDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export const hasPlanRecordForToday = (scope?: string | null) =>
  readTrainingPlanHistory(scope).some(
    (record) => getTodayDateKey(record.createdAt) === getTodayDateKey(),
  );

export const getTodayPlanRecords = (scope?: string | null) =>
  readTrainingPlanHistory(scope).filter(
    (record) => getTodayDateKey(record.createdAt) === getTodayDateKey(),
  );

export const getTodayPlanRecord = (scope?: string | null) =>
  getTodayPlanRecords(scope)[0] ?? null;

export const planRecordMatchesSession = (
  record: TrainingPlanRecord,
  profile: UserProfile,
  difficultyOffset: PlanDifficultyOffset,
) => {
  const snapshot = record.profileSnapshot;
  return (
    snapshot.ageRange === profile.ageRange &&
    snapshot.belt === profile.belt &&
    snapshot.goal === profile.goal &&
    snapshot.weeklyFrequency === profile.weeklyFrequency &&
    snapshot.recentFeeling === profile.recentFeeling &&
    snapshot.menstrualPhase === profile.menstrualPhase &&
    record.difficultyOffset === difficultyOffset
  );
};

export const markTrainingPlanRecordCompleted = (
  recordId: string,
  trainingLogId: string,
  scope?: string | null,
) => {
  const records = readTrainingPlanHistory(scope);
  const next = records.map((record) =>
    record.id === recordId
      ? { ...record, completedAt: Date.now(), trainingLogId }
      : record,
  );
  saveTrainingPlanHistory(next, scope);
};