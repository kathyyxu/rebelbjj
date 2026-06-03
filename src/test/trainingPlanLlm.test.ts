import { describe, expect, it } from "vitest";
import { mergeLlmEnhancement, TrainingPlanLlmEnhancement } from "@/lib/trainingPlanLlm";
import { TrainingPlanResult } from "@/lib/trainingPlanEngine";

const basePlan: TrainingPlanResult = {
  headline: "今日训练方案",
  opening: "规则开场",
  closing: "规则收尾",
  summary: "白带 · 日常精进",
  intensity: "中等",
  intensityScore: 3,
  difficultyOffset: 0,
  personalization: { title: "为什么这样排", items: ["规则要点 A"] },
  warmup: { title: "热身", durationLabel: "8 分钟", items: ["跳绳"] },
  technique: { title: "技术", durationLabel: "25 分钟", items: ["侧压逃脱"] },
  conditioning: { title: "体能", durationLabel: "10 分钟", items: ["波比 3 组"] },
  cooldown: { title: "放松", items: ["拉伸"] },
};

describe("mergeLlmEnhancement", () => {
  it("returns base when enhancement is empty", () => {
    expect(mergeLlmEnhancement(basePlan, null)).toEqual(basePlan);
  });

  it("merges coach copy without touching drill items", () => {
    const enhancement: TrainingPlanLlmEnhancement = {
      opening: "LLM 开场",
      closing: "LLM 收尾",
      praise: "✨ 今天夸夸你的三个优点：\n1. 坚持训练\n2. 认真记录\n3. 疲惫仍上线",
      personalization: { items: ["LLM 要点 1", "LLM 要点 2"] },
      technique: { note: "技术课注意呼吸" },
    };
    const merged = mergeLlmEnhancement(basePlan, enhancement);
    expect(merged.opening).toBe("LLM 开场");
    expect(merged.closing).toBe("LLM 收尾");
    expect(merged.praise).toContain("三个优点");
    expect(merged.personalization.items).toEqual(["LLM 要点 1", "LLM 要点 2"]);
    expect(merged.technique.note).toBe("技术课注意呼吸");
    expect(merged.technique.items).toEqual(["侧压逃脱"]);
    expect(merged.warmup.items).toEqual(["跳绳"]);
  });
});