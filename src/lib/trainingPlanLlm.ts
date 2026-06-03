import { parseISO, startOfDay, startOfWeek } from "date-fns";
import { AppLocale } from "@/lib/locale";
import {
  generateTrainingPlan,
  PlanDifficultyOffset,
  TrainingPlanResult,
} from "@/lib/trainingPlanEngine";
import { readTrainingPlanHistory } from "@/lib/trainingPlanHistory";
import { readTrainingLogs } from "@/lib/trainingLogs";
import { buildTrainingPlanPraise, ensurePlanHasPraise } from "@/lib/trainingPlanPraise";
import { UserProfile } from "@/lib/userProfile";

const API_BASE = import.meta.env.VITE_RUST_API_BASE ?? "";

export type TrainingPlanSource = "rules" | "llm";

export type TrainingPlanCoachContext = {
  sessionsThisWeek: number;
  totalLoggedSessions: number;
  completedPlanSessions: number;
  savedPlanCount: number;
};

export const buildTrainingPlanCoachContext = (
  storageScope?: string | null,
): TrainingPlanCoachContext => {
  const logs = readTrainingLogs(storageScope);
  const history = readTrainingPlanHistory(storageScope);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const sessionsThisWeek = logs.filter((entry) => {
    const day = startOfDay(parseISO(entry.date));
    return day >= weekStart;
  }).length;

  return {
    sessionsThisWeek,
    totalLoggedSessions: logs.length,
    completedPlanSessions: history.filter((record) => record.completedAt).length,
    savedPlanCount: history.length,
  };
};

export type TrainingPlanLlmEnhancement = {
  opening?: string;
  closing?: string;
  praise?: string;
  personalization?: {
    title?: string;
    items?: string[];
  };
  warmup?: { note?: string };
  technique?: { note?: string };
  conditioning?: { note?: string };
  cooldown?: { note?: string };
};

export const mergeLlmEnhancement = (
  base: TrainingPlanResult,
  enhancement: TrainingPlanLlmEnhancement | null | undefined,
): TrainingPlanResult => {
  if (!enhancement) return base;

  const mergeSection = (
    section: TrainingPlanResult["warmup"],
    patch?: { note?: string },
  ) => ({
    ...section,
    note: patch?.note?.trim() || section.note,
  });

  return {
    ...base,
    opening: enhancement.opening?.trim() || base.opening,
    closing: enhancement.closing?.trim() || base.closing,
    praise: enhancement.praise?.trim() || base.praise,
    personalization: {
      title: enhancement.personalization?.title?.trim() || base.personalization.title,
      items:
        enhancement.personalization?.items && enhancement.personalization.items.length > 0
          ? enhancement.personalization.items
          : base.personalization.items,
    },
    warmup: mergeSection(base.warmup, enhancement.warmup),
    technique: mergeSection(base.technique, enhancement.technique),
    conditioning: mergeSection(base.conditioning, enhancement.conditioning),
    cooldown: mergeSection(base.cooldown, enhancement.cooldown),
  };
};

type EnhanceApiResponse = {
  enhancement?: TrainingPlanLlmEnhancement;
  fallback?: boolean;
  error?: string;
};

export const fetchTrainingPlanLlmEnhancement = async (
  basePlan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  difficultyOffset: PlanDifficultyOffset,
  storageScope?: string | null,
  signal?: AbortSignal,
): Promise<TrainingPlanLlmEnhancement | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/training/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        difficultyOffset,
        profile,
        coachContext: buildTrainingPlanCoachContext(storageScope),
        basePlan: {
          headline: basePlan.headline,
          opening: basePlan.opening,
          closing: basePlan.closing,
          summary: basePlan.summary,
          intensity: basePlan.intensity,
          personalization: basePlan.personalization,
          warmup: basePlan.warmup,
          technique: basePlan.technique,
          conditioning: basePlan.conditioning,
          cooldown: basePlan.cooldown,
        },
      }),
      signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as EnhanceApiResponse;
    if (!data.enhancement || data.fallback) return null;
    return data.enhancement;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return null;
  }
};

export const enhanceTrainingPlanWithLlm = async (
  basePlan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  difficultyOffset: PlanDifficultyOffset,
  storageScope?: string | null,
  signal?: AbortSignal,
): Promise<{ plan: TrainingPlanResult; source: TrainingPlanSource }> => {
  const enhancement = await fetchTrainingPlanLlmEnhancement(
    basePlan,
    profile,
    locale,
    difficultyOffset,
    storageScope,
    signal,
  );
  const context = buildTrainingPlanCoachContext(storageScope);
  const baseWithPraise = ensurePlanHasPraise(basePlan, profile, locale, context);

  if (!enhancement) {
    return { plan: baseWithPraise, source: "rules" };
  }
  const merged = mergeLlmEnhancement(baseWithPraise, enhancement);
  return {
    plan: ensurePlanHasPraise(merged, profile, locale, context),
    source: "llm",
  };
};

export const generateTrainingPlanWithEnhancement = async (
  profile: UserProfile,
  locale: AppLocale,
  difficultyOffset: PlanDifficultyOffset = 0,
  storageScope?: string | null,
  signal?: AbortSignal,
): Promise<{ plan: TrainingPlanResult; source: TrainingPlanSource }> => {
  const base = generateTrainingPlan(profile, locale, difficultyOffset);
  const context = buildTrainingPlanCoachContext(storageScope);
  const baseWithPraise = {
    ...base,
    praise: buildTrainingPlanPraise(profile, locale, context),
  };
  return enhanceTrainingPlanWithLlm(
    baseWithPraise,
    profile,
    locale,
    difficultyOffset,
    storageScope,
    signal,
  );
};