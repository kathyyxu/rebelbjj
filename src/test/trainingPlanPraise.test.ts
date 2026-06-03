import { describe, expect, it } from "vitest";
import { buildTrainingPlanPraise } from "@/lib/trainingPlanPraise";
import { UserProfile } from "@/lib/userProfile";

const profile: UserProfile = {
  ageRange: "25-29",
  gender: "female",
  heightCm: 165,
  weightKg: 58,
  belt: "white",
  weeklyFrequency: "3",
  goal: "improvement",
  recentFeeling: "tired",
  updatedAt: Date.now(),
};

describe("buildTrainingPlanPraise", () => {
  it("always returns title and three numbered lines", () => {
    const praise = buildTrainingPlanPraise(profile, "zh-CN", {
      sessionsThisWeek: 2,
      totalLoggedSessions: 5,
      completedPlanSessions: 1,
      savedPlanCount: 3,
    });
    expect(praise).toContain("三个优点");
    expect(praise).toMatch(/1\./);
    expect(praise).toMatch(/2\./);
    expect(praise).toMatch(/3\./);
    expect(praise).toContain("本周已训练 2 次");
  });
});