import type { VercelRequest, VercelResponse } from "@vercel/node";

type PlanSectionPayload = {
  title: string;
  durationLabel?: string;
  items: string[];
  note?: string;
};

type BasePlanPayload = {
  headline: string;
  opening: string;
  closing: string;
  summary: string;
  intensity: string;
  personalization: { title: string; items: string[] };
  warmup: PlanSectionPayload;
  technique: PlanSectionPayload;
  conditioning: PlanSectionPayload;
  cooldown: PlanSectionPayload;
};

type ProfilePayload = {
  ageRange: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  belt: string;
  weeklyFrequency: string;
  goal: string;
  recentFeeling?: string;
  menstrualPhase?: string;
};

type EnhanceRequest = {
  locale: string;
  difficultyOffset: number;
  profile: ProfilePayload;
  basePlan: BasePlanPayload;
};

type LlmEnhancement = {
  opening?: string;
  closing?: string;
  personalization?: { title?: string; items?: string[] };
  warmup?: { note?: string };
  technique?: { note?: string };
  conditioning?: { note?: string };
  cooldown?: { note?: string };
};

const MAX_TEXT = 1200;
const MAX_ITEMS = 8;

const localeNames: Record<string, string> = {
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  en: "English",
  ja: "Japanese",
};

const trimText = (value: unknown, max = MAX_TEXT): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
};

const trimItems = (value: unknown, maxCount: number): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxCount)
    .map((item) => item.slice(0, 280));
  return items.length > 0 ? items : undefined;
};

const parseEnhancement = (raw: string): LlmEnhancement | null => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = (fenced?.[1] ?? raw).trim();
  if (!candidate.startsWith("{")) {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (objectMatch) candidate = objectMatch[0];
  }
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const personalization =
      parsed.personalization && typeof parsed.personalization === "object"
        ? (parsed.personalization as Record<string, unknown>)
        : null;

    return {
      opening: trimText(parsed.opening),
      closing: trimText(parsed.closing),
      personalization: personalization
        ? {
            title: trimText(personalization.title, 120),
            items: trimItems(personalization.items, MAX_ITEMS),
          }
        : undefined,
      warmup:
        parsed.warmup && typeof parsed.warmup === "object"
          ? { note: trimText((parsed.warmup as Record<string, unknown>).note, 400) }
          : undefined,
      technique:
        parsed.technique && typeof parsed.technique === "object"
          ? { note: trimText((parsed.technique as Record<string, unknown>).note, 400) }
          : undefined,
      conditioning:
        parsed.conditioning && typeof parsed.conditioning === "object"
          ? { note: trimText((parsed.conditioning as Record<string, unknown>).note, 400) }
          : undefined,
      cooldown:
        parsed.cooldown && typeof parsed.cooldown === "object"
          ? { note: trimText((parsed.cooldown as Record<string, unknown>).note, 400) }
          : undefined,
    };
  } catch {
    return null;
  }
};

const buildPrompt = (body: EnhanceRequest): string => {
  const language = localeNames[body.locale] ?? body.locale;
  return [
    "You are an experienced Brazilian Jiu-Jitsu coach writing session copy for Rebel BJJ.",
    `Write ALL user-facing strings in ${language}.`,
    "The workout structure (sections, drill items, durations, intensity) is FIXED — do not change item lists or durations.",
    "Return ONLY valid JSON with this shape (omit keys you do not change):",
    '{"opening":"...","closing":"...","personalization":{"title":"...","items":["..."]},"warmup":{"note":"..."},"technique":{"note":"..."},"conditioning":{"note":"..."},"cooldown":{"note":"..."}}',
    "Tone: direct, warm, professional coach — not generic AI fluff. Reference athlete context naturally.",
    "personalization.items: 2-4 short bullets. Section notes: optional 1-2 sentences max.",
    "",
    `Athlete profile JSON:\n${JSON.stringify(body.profile)}`,
    `Difficulty offset: ${body.difficultyOffset} (-2 easier … +2 harder)`,
    `Base plan JSON (structure locked):\n${JSON.stringify(body.basePlan)}`,
  ].join("\n");
};

type Provider = "gemini" | "openai" | "groq" | "openrouter" | "xai";

const resolveProvider = (): Provider => {
  const configured = (process.env.TRAINING_PLAN_LLM_PROVIDER ?? "gemini").toLowerCase();
  if (
    configured === "gemini" ||
    configured === "openai" ||
    configured === "groq" ||
    configured === "openrouter" ||
    configured === "xai"
  ) {
    return configured;
  }
  return "gemini";
};

const resolveApiKey = (provider: Provider): string | undefined => {
  const shared = process.env.TRAINING_PLAN_LLM_API_KEY?.trim();
  if (shared) return shared;
  const map: Record<Provider, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    xai: process.env.XAI_API_KEY,
  };
  return map[provider]?.trim();
};

const callGemini = async (apiKey: string, prompt: string): Promise<string> => {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("gemini error", response.status, detail.slice(0, 400));
    throw new Error(`gemini ${response.status}`);
  }
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("gemini empty response");
  return text;
};

const callOpenAiCompatible = async (
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders?: Record<string, string>,
): Promise<string> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You output only JSON for BJJ coaching copy. No markdown outside JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`llm ${response.status}`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("llm empty response");
  return text;
};

const callProvider = async (provider: Provider, apiKey: string, prompt: string): Promise<string> => {
  switch (provider) {
    case "gemini":
      return callGemini(apiKey, prompt);
    case "openai":
      return callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        prompt,
      );
    case "groq":
      return callOpenAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        apiKey,
        process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
        prompt,
      );
    case "openrouter":
      return callOpenAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        apiKey,
        process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.0-flash-001",
        prompt,
        {
          "HTTP-Referer": "https://phantom-thief-s-mat-main.vercel.app",
          "X-Title": "Rebel BJJ Training Plan",
        },
      );
    case "xai":
      return callOpenAiCompatible(
        "https://api.x.ai/v1/chat/completions",
        apiKey,
        process.env.XAI_MODEL?.trim() || "grok-2-1212",
        prompt,
      );
    default:
      throw new Error("unsupported provider");
  }
};

const isValidRequest = (body: unknown): body is EnhanceRequest => {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  if (typeof record.locale !== "string" || !record.locale) return false;
  if (typeof record.difficultyOffset !== "number") return false;
  if (!record.profile || typeof record.profile !== "object") return false;
  if (!record.basePlan || typeof record.basePlan !== "object") return false;
  const plan = record.basePlan as Record<string, unknown>;
  return typeof plan.opening === "string" && Array.isArray((plan.warmup as PlanSectionPayload)?.items);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = req.body as unknown;
  if (!isValidRequest(body)) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const provider = resolveProvider();
  const apiKey = resolveApiKey(provider);
  if (!apiKey) {
    return res.status(503).json({ error: "llm_not_configured", fallback: true });
  }

  try {
    const prompt = buildPrompt(body);
    const raw = await callProvider(provider, apiKey, prompt);
    const enhancement = parseEnhancement(raw);
    if (!enhancement) {
      console.error("invalid llm json", raw.slice(0, 600));
      return res.status(502).json({ error: "invalid_llm_response", fallback: true });
    }
    return res.status(200).json({ enhancement, provider });
  } catch (error) {
    console.error("training plan llm error", error);
    return res.status(502).json({ error: "llm_request_failed", fallback: true });
  }
}