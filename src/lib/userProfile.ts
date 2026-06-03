import {
  readScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/storage";
import { MenstrualPhase, MENSTRUAL_PHASES } from "@/lib/trainingLogs";

export { MENSTRUAL_PHASES };
export type { MenstrualPhase };

export const USER_PROFILE_STORAGE_KEY = "bjj-rebel-user-profile-v1";

export const AGE_RANGES = [
  "12-17",
  "18-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50plus",
] as const;

export const BELT_LEVELS = ["white", "blue", "purple", "brown", "black"] as const;
export const GENDERS = ["female", "male", "undisclosed"] as const;
export const WEEKLY_FREQUENCIES = ["1", "2", "3", "4plus"] as const;
export const TRAINING_GOALS = [
  "competition",
  "improvement",
  "fat-loss",
  "recovery",
  "health",
] as const;
export const RECENT_FEELINGS = ["energetic", "normal", "tired"] as const;

export type AgeRange = (typeof AGE_RANGES)[number];
export type BeltLevel = (typeof BELT_LEVELS)[number];
export type Gender = (typeof GENDERS)[number];
export type WeeklyFrequency = (typeof WEEKLY_FREQUENCIES)[number];
export type TrainingGoal = (typeof TRAINING_GOALS)[number];
export type RecentFeeling = (typeof RECENT_FEELINGS)[number];

export type UserProfile = {
  ageRange: AgeRange;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  belt: BeltLevel;
  weeklyFrequency: WeeklyFrequency;
  goal: TrainingGoal;
  recentFeeling?: RecentFeeling;
  menstrualPhase?: MenstrualPhase;
  updatedAt: number;
};

export type UserProfileDraft = {
  ageRange: AgeRange | "";
  gender: Gender | "";
  heightCm: string;
  weightKg: string;
  belt: BeltLevel | "";
  weeklyFrequency: WeeklyFrequency | "";
  goal: TrainingGoal | "";
  recentFeeling: RecentFeeling | "";
  menstrualPhase: MenstrualPhase | "";
};

export const isSeniorAgeRange = (ageRange: AgeRange) =>
  ageRange === "35-39" ||
  ageRange === "40-44" ||
  ageRange === "45-49" ||
  ageRange === "50plus";

export const ageRangeToRepresentativeAge = (ageRange: AgeRange): number => {
  const map: Record<AgeRange, number> = {
    "12-17": 15,
    "18-24": 21,
    "25-29": 27,
    "30-34": 32,
    "35-39": 37,
    "40-44": 42,
    "45-49": 47,
    "50plus": 55,
  };
  return map[ageRange];
};

export const migrateNumericAgeToRange = (age: number): AgeRange | null => {
  if (!Number.isFinite(age) || age < 12) return null;
  if (age <= 17) return "12-17";
  if (age <= 24) return "18-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  return "50plus";
};

export const createEmptyProfileDraft = (): UserProfileDraft => ({
  ageRange: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  belt: "",
  weeklyFrequency: "",
  goal: "",
  recentFeeling: "",
  menstrualPhase: "",
});

export const profileToDraft = (profile: UserProfile): UserProfileDraft => ({
  ageRange: profile.ageRange,
  gender: profile.gender,
  heightCm: String(profile.heightCm),
  weightKg: String(profile.weightKg),
  belt: profile.belt,
  weeklyFrequency: profile.weeklyFrequency,
  goal: profile.goal,
  recentFeeling: profile.recentFeeling ?? "",
  menstrualPhase: profile.menstrualPhase ?? "",
});

const parsePositiveNumber = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

export const draftToProfile = (draft: UserProfileDraft): UserProfile | null => {
  const heightCm = parsePositiveNumber(draft.heightCm, 120, 220);
  const weightKg = parsePositiveNumber(draft.weightKg, 30, 200);

  if (
    heightCm === null ||
    weightKg === null ||
    !draft.ageRange ||
    !AGE_RANGES.includes(draft.ageRange) ||
    !draft.gender ||
    !draft.belt ||
    !draft.weeklyFrequency ||
    !draft.goal
  ) {
    return null;
  }

  return {
    ageRange: draft.ageRange,
    gender: draft.gender,
    heightCm,
    weightKg,
    belt: draft.belt,
    weeklyFrequency: draft.weeklyFrequency,
    goal: draft.goal,
    recentFeeling: draft.recentFeeling || undefined,
    menstrualPhase:
      draft.gender === "female" && draft.menstrualPhase ? draft.menstrualPhase : undefined,
    updatedAt: Date.now(),
  };
};

export const isProfileComplete = (profile: UserProfile | null): profile is UserProfile =>
  !!profile &&
  AGE_RANGES.includes(profile.ageRange) &&
  profile.heightCm >= 120 &&
  profile.weightKg >= 30 &&
  BELT_LEVELS.includes(profile.belt) &&
  GENDERS.includes(profile.gender) &&
  WEEKLY_FREQUENCIES.includes(profile.weeklyFrequency) &&
  TRAINING_GOALS.includes(profile.goal);

const parseStoredProfile = (parsed: Record<string, unknown>): UserProfile | null => {
  let ageRange: AgeRange | null = null;

  if (typeof parsed.ageRange === "string" && AGE_RANGES.includes(parsed.ageRange as AgeRange)) {
    ageRange = parsed.ageRange as AgeRange;
  } else if (typeof parsed.age === "number") {
    ageRange = migrateNumericAgeToRange(parsed.age);
  }

  const heightCm = Number(parsed.heightCm);
  const weightKg = Number(parsed.weightKg);

  if (!ageRange) return null;

  const profile: UserProfile = {
    ageRange,
    gender: parsed.gender as Gender,
    heightCm,
    weightKg,
    belt: parsed.belt as BeltLevel,
    weeklyFrequency: parsed.weeklyFrequency as WeeklyFrequency,
    goal: parsed.goal as TrainingGoal,
    recentFeeling: parsed.recentFeeling as RecentFeeling | undefined,
    menstrualPhase:
      parsed.gender === "female" &&
      typeof parsed.menstrualPhase === "string" &&
      MENSTRUAL_PHASES.includes(parsed.menstrualPhase as MenstrualPhase)
        ? (parsed.menstrualPhase as MenstrualPhase)
        : undefined,
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
  };

  return isProfileComplete(profile) ? profile : null;
};

export const readUserProfile = (scope?: string | null): UserProfile | null => {
  const raw = readScopedStorageItem(USER_PROFILE_STORAGE_KEY, scope);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parseStoredProfile(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
};

export const saveUserProfile = (profile: UserProfile, scope?: string | null) => {
  writeScopedStorageItem(
    USER_PROFILE_STORAGE_KEY,
    JSON.stringify({ ...profile, updatedAt: Date.now() }),
    scope,
  );
};