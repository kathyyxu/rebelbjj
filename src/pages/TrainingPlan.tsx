import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AtlasFeatureTabs } from "@/components/AtlasFeatureTabs";
import { useIdentity } from "@/lib/identity";
import { useLocale } from "@/lib/locale";
import { toast } from "@/components/ui/sonner";
import {
  completeTrainingPlanSession,
  getTodayPlanCompletion,
  isPlanRecordFromToday,
} from "@/lib/trainingPlanComplete";
import {
  appendTrainingPlanRecord,
  deleteTrainingPlanRecord,
  getTodayPlanRecord,
  hasPlanRecordForToday,
  planRecordMatchesSession,
  readDifficultyOffset,
  readTrainingPlanHistory,
  saveDifficultyOffset,
  TrainingPlanRecord,
} from "@/lib/trainingPlanHistory";
import {
  adjustDifficultyOffset,
  PlanDifficultyOffset,
  TrainingPlanResult,
  TrainingPlanSection,
} from "@/lib/trainingPlanEngine";
import {
  generateTrainingPlanWithEnhancement,
  TrainingPlanSource,
} from "@/lib/trainingPlanLlm";
import { AgeRange, isProfileComplete, readUserProfile } from "@/lib/userProfile";

const PlanSectionCard = ({ section }: { section: TrainingPlanSection }) => (
  <article className="atlas-panel atlas-knowledge phantom-plan-section">
    <div className="phantom-plan-section-head">
      <h3 className="atlas-section-title">{section.title}</h3>
      {section.durationLabel ? <span className="phantom-plan-duration">{section.durationLabel}</span> : null}
    </div>
    <ul className="phantom-plan-list">
      {section.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    {section.note ? <p className="phantom-plan-note">{section.note}</p> : null}
  </article>
);

type TrainingPlanPdfSheetProps = {
  plan: TrainingPlanResult;
  exportTitle: string;
  identityLabel: string;
};

const TrainingPlanPdfSheet = ({ plan, exportTitle, identityLabel }: TrainingPlanPdfSheetProps) => (
  <section className="atlas-panel atlas-knowledge phantom-export-sheet">
    <div className="atlas-section-head">
      <p className="atlas-section-tag">AI COACH PLAN / PDF</p>
      <h2 className="atlas-section-title">REBEL BJJ SESSION PLAN</h2>
    </div>
    <div className="phantom-export-intro">
      <p>Rebel BJJ / {identityLabel}</p>
      <p>{exportTitle}</p>
      <p>{plan.summary}</p>
      <p>
        {plan.headline} — {plan.intensity}
      </p>
      <p>{plan.opening}</p>
    </div>
    <div className="phantom-export-list">
      <article className="phantom-export-card">
        <div className="phantom-export-card-head">
          <strong>{plan.personalization.title}</strong>
        </div>
        {plan.personalization.items.map((item) => (
          <p key={item}>• {item}</p>
        ))}
      </article>
      {[plan.warmup, plan.technique, plan.conditioning, plan.cooldown].map((section) => (
        <article key={section.title} className="phantom-export-card">
          <div className="phantom-export-card-head">
            <strong>{section.title}</strong>
            {section.durationLabel ? <span>{section.durationLabel}</span> : null}
          </div>
          {section.items.map((item) => (
            <p key={item}>🥋 {item}</p>
          ))}
        </article>
      ))}
      {plan.praise ? (
        <article className="phantom-export-card">
          <p>{plan.praise}</p>
        </article>
      ) : null}
    </div>
  </section>
);

const TrainingPlan = () => {
  const { pick, locale } = useLocale();
  const { storageScope, hasEmailIdentity, hasWalletIdentity, currentIdentityLabel } = useIdentity();
  const [history, setHistory] = useState<TrainingPlanRecord[]>(() =>
    readTrainingPlanHistory(storageScope),
  );
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [difficultyOffset, setDifficultyOffset] = useState<PlanDifficultyOffset>(() =>
    readDifficultyOffset(storageScope),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isScopeReady, setIsScopeReady] = useState(true);
  const [livePlan, setLivePlan] = useState<TrainingPlanResult | null>(null);
  const [planSource, setPlanSource] = useState<TrainingPlanSource>("rules");
  const [isEnhancingPlan, setIsEnhancingPlan] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const seededTodayRef = useRef(false);
  const planGenerationRef = useRef(0);
  const persistAfterDifficultyRef = useRef(false);

  const isLoggedIn = hasEmailIdentity || hasWalletIdentity;

  const profile = useMemo(
    () => readUserProfile(storageScope),
    [storageScope, isScopeReady],
  );

  const activeRecord = activeRecordId
    ? history.find((record) => record.id === activeRecordId) ?? null
    : null;

  const displayedPlan = activeRecord?.plan ?? livePlan;

  const sessionPlanRecord = useMemo(() => {
    if (activeRecord) return activeRecord;
    const latestToday = getTodayPlanRecord(storageScope);
    if (
      latestToday &&
      profile &&
      isProfileComplete(profile) &&
      planRecordMatchesSession(latestToday, profile, difficultyOffset)
    ) {
      return latestToday;
    }
    return null;
  }, [activeRecord, difficultyOffset, history, profile, storageScope]);

  const todayCompletion = useMemo(() => {
    if (!sessionPlanRecord) return null;
    return getTodayPlanCompletion(storageScope, sessionPlanRecord.id);
  }, [sessionPlanRecord, history, storageScope]);

  const ageRangeLabels: Record<AgeRange, string> = {
    "12-17": pick({ "zh-CN": "12–17 岁", "zh-TW": "12–17 歲", en: "12–17", ja: "12–17歳" }),
    "18-24": pick({ "zh-CN": "18–24 岁", "zh-TW": "18–24 歲", en: "18–24", ja: "18–24歳" }),
    "25-29": pick({ "zh-CN": "25–29 岁", "zh-TW": "25–29 歲", en: "25–29", ja: "25–29歳" }),
    "30-34": pick({ "zh-CN": "30–34 岁", "zh-TW": "30–34 歲", en: "30–34", ja: "30–34歳" }),
    "35-39": pick({ "zh-CN": "35–39 岁", "zh-TW": "35–39 歲", en: "35–39", ja: "35–39歳" }),
    "40-44": pick({ "zh-CN": "40–44 岁", "zh-TW": "40–44 歲", en: "40–44", ja: "40–44歳" }),
    "45-49": pick({ "zh-CN": "45–49 岁", "zh-TW": "45–49 歲", en: "45–49", ja: "45–49歳" }),
    "50plus": pick({ "zh-CN": "50+", "zh-TW": "50+", en: "50+", ja: "50歳+" }),
  };

  const reloadHistory = useCallback(() => {
    setHistory(readTrainingPlanHistory(storageScope));
  }, [storageScope]);

  const persistPlan = useCallback(
    (plan: TrainingPlanResult) => {
      if (!profile || !isProfileComplete(profile)) return null;
      const record = appendTrainingPlanRecord(plan, profile, locale, storageScope);
      reloadHistory();
      return record;
    },
    [locale, profile, reloadHistory, storageScope],
  );

  useEffect(() => {
    setIsScopeReady(false);
    setHistory(readTrainingPlanHistory(storageScope));
    setDifficultyOffset(readDifficultyOffset(storageScope));
    setActiveRecordId(null);
    seededTodayRef.current = false;
    setLivePlan(null);
    setPlanSource("rules");
    setIsScopeReady(true);
  }, [storageScope]);

  useEffect(() => {
    if (!isScopeReady) return;
    saveDifficultyOffset(difficultyOffset, storageScope);
  }, [difficultyOffset, isScopeReady, storageScope]);

  useEffect(() => {
    if (!isScopeReady || !profile || !isProfileComplete(profile)) {
      setLivePlan(null);
      setPlanSource("rules");
      setIsEnhancingPlan(false);
      return;
    }

    const generationId = planGenerationRef.current + 1;
    planGenerationRef.current = generationId;
    const controller = new AbortController();
    setIsEnhancingPlan(true);

    void generateTrainingPlanWithEnhancement(
      profile,
      locale,
      difficultyOffset,
      storageScope,
      controller.signal,
    )
      .then(({ plan, source }) => {
        if (planGenerationRef.current !== generationId) return;
        setLivePlan(plan);
        setPlanSource(source);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (planGenerationRef.current !== generationId) return;
      })
      .finally(() => {
        if (planGenerationRef.current !== generationId) return;
        setIsEnhancingPlan(false);
      });

    return () => controller.abort();
  }, [difficultyOffset, isScopeReady, locale, profile, storageScope]);

  useEffect(() => {
    if (
      !isScopeReady ||
      !profile ||
      !isProfileComplete(profile) ||
      !livePlan ||
      isEnhancingPlan
    ) {
      return;
    }
    if (seededTodayRef.current || activeRecordId) return;
    seededTodayRef.current = true;

    if (!hasPlanRecordForToday(storageScope)) {
      persistPlan(livePlan);
    }
  }, [activeRecordId, isEnhancingPlan, isScopeReady, livePlan, persistPlan, profile, storageScope]);

  useEffect(() => {
    if (
      !persistAfterDifficultyRef.current ||
      isEnhancingPlan ||
      !livePlan ||
      !profile ||
      !isProfileComplete(profile)
    ) {
      return;
    }
    persistAfterDifficultyRef.current = false;
    persistPlan(livePlan);
  }, [isEnhancingPlan, livePlan, persistPlan, profile]);

  const handleRegenerate = async () => {
    if (!profile || !isProfileComplete(profile) || isEnhancingPlan) return;
    setIsEnhancingPlan(true);
    try {
      const { plan, source } = await generateTrainingPlanWithEnhancement(
        profile,
        locale,
        difficultyOffset,
        storageScope,
      );
      setLivePlan(plan);
      setPlanSource(source);
      const record = persistPlan(plan);
      if (record) setActiveRecordId(record.id);
      toast.success(
        pick({
          "zh-CN": "已根据当前资料重新生成并存档。",
          "zh-TW": "已根據當前資料重新生成並存檔。",
          en: "Regenerated from your profile and saved.",
          ja: "プロフィールから再生成し保存しました。",
        }),
      );
    } finally {
      setIsEnhancingPlan(false);
    }
  };

  const handleDifficultyChange = (direction: "easier" | "harder") => {
    const next = adjustDifficultyOffset(difficultyOffset, direction);
    if (next === difficultyOffset) {
      toast.message(
        pick({
          "zh-CN": "已达到难度调节上限。",
          "zh-TW": "已達到難度調節上限。",
          en: "Difficulty adjustment limit reached.",
          ja: "難易度調整の上限です。",
        }),
      );
      return;
    }

    setDifficultyOffset(next);
    setActiveRecordId(null);
    persistAfterDifficultyRef.current = true;

    toast.success(
      pick({
        "zh-CN": direction === "harder" ? "好，今天方案加了一点强度。" : "好，今天方案稍微轻松一点。",
        "zh-TW": direction === "harder" ? "好，今天方案加了一點強度。" : "好，今天方案稍微輕鬆一點。",
        en: direction === "harder" ? "Got it — today’s plan is a notch harder." : "Got it — today’s plan is a bit lighter.",
        ja: direction === "harder" ? "了解、今日は少しハードにした。" : "了解、今日は少し軽くした。",
      }),
    );
  };

  const handleDeleteRecord = (id: string) => {
    deleteTrainingPlanRecord(id, storageScope);
    reloadHistory();
    if (activeRecordId === id) setActiveRecordId(null);
    toast.success(
      pick({
        "zh-CN": "历史记录已删除。",
        "zh-TW": "歷史記錄已刪除。",
        en: "History entry deleted.",
        ja: "履歴を削除しました。",
      }),
    );
  };

  const handleCompleteSession = async () => {
    if (!profile || !isProfileComplete(profile) || !displayedPlan || isCompleting) return;

    if (activeRecord && !isPlanRecordFromToday(activeRecord)) {
      toast.message(
        pick({
          "zh-CN": "历史方案不能记入今天，请切回「当前方案」再点完成。",
          "zh-TW": "歷史方案不能記入今天，請切回「當前方案」再點完成。",
          en: "Switch to today’s current plan before marking complete.",
          ja: "履歴プランは完了にできません。現在のプランに戻ってください。",
        }),
      );
      return;
    }

    setIsCompleting(true);
    try {
      let planRecord: TrainingPlanRecord | null = null;
      if (activeRecord && isPlanRecordFromToday(activeRecord)) {
        planRecord = activeRecord;
      } else if (sessionPlanRecord) {
        planRecord = sessionPlanRecord;
      } else {
        planRecord = persistPlan(displayedPlan);
      }
      if (!planRecord) {
        throw new Error("plan record missing");
      }

      const result = completeTrainingPlanSession(
        displayedPlan,
        profile,
        locale,
        planRecord,
        storageScope,
      );
      reloadHistory();

      toast.success(
        pick({
          "zh-CN": result.isUpdate
            ? "已更新今天的训练记录。"
            : "已记入今天的训练记录，去训练日志里看看吧。",
          "zh-TW": result.isUpdate
            ? "已更新今天的訓練記錄。"
            : "已記入今天的訓練記錄，去訓練日誌裡看看吧。",
          en: result.isUpdate
            ? "Today’s training log updated."
            : "Logged to today’s training record — check your training log.",
          ja: result.isUpdate
            ? "今日の練習記録を更新しました。"
            : "今日の練習記録に保存しました。",
        }),
      );
    } catch {
      toast.error(
        pick({
          "zh-CN": "记录失败，请稍后再试。",
          "zh-TW": "記錄失敗，請稍後再試。",
          en: "Could not save to training log. Try again.",
          ja: "保存に失敗しました。",
        }),
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExportPdf = async () => {
    const captureRoot = exportRef.current?.parentElement;
    if (!displayedPlan || !exportRef.current || !captureRoot) return;

    setIsExporting(true);
    try {
      if (profile && isProfileComplete(profile) && livePlan && !activeRecordId) {
        persistPlan(livePlan);
      }

      const module = await import("html2pdf.js");
      const html2pdf = (module.default ?? module) as {
        (): {
          set: (options: Record<string, unknown>) => {
            from: (element: HTMLElement) => { save: () => Promise<void> };
          };
        };
      };

      const stamp = format(
        activeRecord ? new Date(activeRecord.createdAt) : new Date(),
        "yyyy-MM-dd-HHmm",
      );

      const previousCaptureStyle = captureRoot.getAttribute("style");
      captureRoot.setAttribute(
        "style",
        "position:fixed;left:0;top:0;width:794px;z-index:-1;opacity:0.01;pointer-events:none;visibility:visible;",
      );
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      await html2pdf()
        .set({
          margin: 10,
          filename: `rebel-bjj-training-plan-${stamp}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, backgroundColor: "#050505", useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(exportRef.current)
        .save();

      if (previousCaptureStyle === null) {
        captureRoot.removeAttribute("style");
      } else {
        captureRoot.setAttribute("style", previousCaptureStyle);
      }

      toast.success(
        pick({
          "zh-CN": "训练方案 PDF 已下载。",
          "zh-TW": "訓練方案 PDF 已下載。",
          en: "Training plan PDF downloaded.",
          ja: "PDFをダウンロードしました。",
        }),
      );
    } catch {
      toast.error(
        pick({
          "zh-CN": "PDF 导出失败，请稍后再试。",
          "zh-TW": "PDF 導出失敗，請稍後再試。",
          en: "PDF export failed. Please try again.",
          ja: "PDFの出力に失敗しました。",
        }),
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="atlas-app">
        <div className="atlas-shell">
          <header className="atlas-hero atlas-panel">
            <div className="atlas-hero-copy">
              <div className="atlas-chip">AI COACH TRAINING PLAN</div>
              <h1 className="atlas-title persona-page-title">
                {pick({
                  "zh-CN": "AI教练",
                  "zh-TW": "AI教練",
                  en: "AI COACH",
                  ja: "AIコーチ",
                })}
                <span>
                  {pick({
                    "zh-CN": "训练方案",
                    "zh-TW": "訓練方案",
                    en: " TRAINING PLAN",
                    ja: "トレーニングプラン",
                  })}
                </span>
              </h1>
              <p className="atlas-description">
                {pick({
                  "zh-CN": "生成专属训练方案前，请先完成登录。",
                  "zh-TW": "生成專屬訓練方案前，請先完成登入。",
                  en: "Sign in before we can build your session plan.",
                  ja: "専用プランを作るには、先にログインしてください。",
                })}
              </p>
            </div>
          </header>

          <AtlasFeatureTabs />

          <section className="atlas-panel atlas-knowledge phantom-plan-login-gate">
            <div className="atlas-section-head">
              <p className="atlas-section-tag">SIGN IN</p>
              <h2 className="atlas-section-title">
                {pick({
                  "zh-CN": "请先登录",
                  "zh-TW": "請先登入",
                  en: "Sign in first",
                  ja: "先にログイン",
                })}
              </h2>
            </div>
            <p className="phantom-plan-login-gate-lead">
              {pick({
                "zh-CN": "点击页面右上角的邮箱图标或钱包图标，用邮箱或钱包完成登录。",
                "zh-TW": "點擊頁面右上角的信箱圖示或錢包圖示，用信箱或錢包完成登入。",
                en: "Use the email or wallet icon in the top-right corner to sign in.",
                ja: "右上のメールまたはウォレットアイコンからログインしてください。",
              })}
            </p>
            <p className="phantom-plan-login-gate-hint">
              {pick({
                "zh-CN": "登录邮箱或者钱包后，可以一键生成专属于你的训练方案。",
                "zh-TW": "登入信箱或者錢包後，可以一鍵生成專屬於你的訓練方案。",
                en: "Once you’re signed in, one tap generates a training plan built just for you.",
                ja: "ログイン後、ワンタップであなた専用のトレーニングプランを生成できます。",
              })}
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!isProfileComplete(profile)) {
    return (
      <main className="atlas-app">
        <div className="atlas-shell">
          <header className="atlas-hero atlas-panel">
            <div className="atlas-hero-copy">
              <div className="atlas-chip">AI COACH / PROFILE</div>
              <h1 className="atlas-title persona-page-title">
                {pick({
                  "zh-CN": "AI教练",
                  "zh-TW": "AI教練",
                  en: "AI COACH",
                  ja: "AIコーチ",
                })}
                <span>
                  {pick({
                    "zh-CN": "训练方案",
                    "zh-TW": "訓練方案",
                    en: " TRAINING PLAN",
                    ja: "トレーニングプラン",
                  })}
                </span>
              </h1>
              <p className="atlas-description">
                {pick({
                  "zh-CN": "你已登录。再填一次个人资料，就能一键生成今天的专属方案。",
                  "zh-TW": "你已登入。再填一次個人資料，就能一鍵生成今天的專屬方案。",
                  en: "You’re signed in. Complete your profile to generate today’s plan.",
                  ja: "ログイン済みです。プロフィールを入力するとプランを生成できます。",
                })}
              </p>
            </div>
          </header>

          <AtlasFeatureTabs />

          <section className="atlas-panel atlas-knowledge phantom-plan-login-gate">
            <div className="atlas-section-head">
              <p className="atlas-section-tag">PROFILE</p>
              <h2 className="atlas-section-title">
                {pick({
                  "zh-CN": "先完善个人资料",
                  "zh-TW": "先完善個人資料",
                  en: "Complete your profile",
                  ja: "プロフィールを入力",
                })}
              </h2>
            </div>
            <p className="phantom-plan-login-gate-lead">
              {pick({
                "zh-CN": "带色、目标、今日感受和（如适用）生理周期填好后，系统才能为你生成 AI 教练训练方案。",
                "zh-TW": "帶色、目標、今日感受和（如適用）生理週期填好後，系統才能為你生成 AI 教練訓練方案。",
                en: "Belt, goals, how you feel today, and cycle phase (if relevant) power your AI coach plan.",
                ja: "帯・目標・今日のコンディションなどを入力してからプランを生成します。",
              })}
            </p>
            <Link
              to="/profile?returnTo=/training-plan"
              className="atlas-home-cta phantom-diary-action phantom-plan-complete-btn"
            >
              <Brain className="h-4 w-4" />
              <span>
                {pick({
                  "zh-CN": "去填写个人资料",
                  "zh-TW": "去填寫個人資料",
                  en: "Fill in profile",
                  ja: "プロフィールへ",
                })}
              </span>
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!displayedPlan) {
    return (
      <main className="atlas-app">
        <div className="atlas-shell">
          <header className="atlas-hero atlas-panel">
            <div className="atlas-hero-copy">
              <div className="atlas-chip">
                {pick({
                  "zh-CN": "正在生成方案…",
                  "zh-TW": "正在生成方案…",
                  en: "BUILDING YOUR PLAN…",
                  ja: "プラン生成中…",
                })}
              </div>
              <h1 className="atlas-title persona-page-title">
                {pick({
                  "zh-CN": "AI教练",
                  "zh-TW": "AI教練",
                  en: "AI COACH",
                  ja: "AIコーチ",
                })}
                <span>
                  {pick({
                    "zh-CN": "训练方案",
                    "zh-TW": "訓練方案",
                    en: " TRAINING PLAN",
                    ja: "トレーニングプラン",
                  })}
                </span>
              </h1>
              <p className="atlas-description">
                {pick({
                  "zh-CN": "规则引擎先搭好训练骨架，AI 教练正在润色讲解…",
                  "zh-TW": "規則引擎先搭好訓練骨架，AI 教練正在潤色講解…",
                  en: "Rules build the session skeleton; the AI coach is polishing your briefing…",
                  ja: "ルールで骨格を組み、AIコーチが文案を整えています…",
                })}
              </p>
            </div>
          </header>
          <AtlasFeatureTabs />
        </div>
      </main>
    );
  }

  const exportTitle = activeRecord
    ? format(new Date(activeRecord.createdAt), "yyyy-MM-dd HH:mm")
    : format(new Date(), "yyyy-MM-dd HH:mm");

  const offsetLabel =
    difficultyOffset === 0
      ? pick({ "zh-CN": "按默认强度", "zh-TW": "按預設強度", en: "Default load", ja: "標準" })
      : difficultyOffset > 0
        ? pick({
            "zh-CN": "你往上调过难度",
            "zh-TW": "你往上調過難度",
            en: "You bumped it harder",
            ja: "難易度アップ済み",
          })
        : pick({
            "zh-CN": "你往下调过难度",
            "zh-TW": "你往下調過難度",
            en: "You eased it down",
            ja: "難易度ダウン済み",
          });

  return (
    <main className="atlas-app phantom-diary-stage">
      <div className="atlas-shell">
        <header className="atlas-hero atlas-panel">
          <div className="atlas-hero-copy">
            <div className="atlas-chip">
              {activeRecord
                ? pick({
                    "zh-CN": "历史方案",
                    "zh-TW": "歷史方案",
                    en: "SAVED PLAN",
                    ja: "保存プラン",
                  })
                : isEnhancingPlan
                  ? pick({
                      "zh-CN": "AI 教练撰写中…",
                      "zh-TW": "AI 教練撰寫中…",
                      en: "AI COACH WRITING…",
                      ja: "AIコーチ生成中…",
                    })
                  : planSource === "llm"
                    ? pick({
                        "zh-CN": "AI 教练 · 规则骨架",
                        "zh-TW": "AI 教練 · 規則骨架",
                        en: "AI COACH · RULE SKELETON",
                        ja: "AIコーチ・ルール骨格",
                      })
                    : pick({
                        "zh-CN": "规则引擎（API 未启用或失败）",
                        "zh-TW": "規則引擎（API 未啟用或失敗）",
                        en: "RULE ENGINE (API OFFLINE)",
                        ja: "ルールエンジン（API未使用）",
                      })}
            </div>
            <h1 className="atlas-title persona-page-title">
              {pick({
                "zh-CN": "AI教练",
                "zh-TW": "AI教練",
                en: "AI COACH",
                ja: "AIコーチ",
              })}
              <span>
                {pick({
                  "zh-CN": "训练方案",
                  "zh-TW": "訓練方案",
                  en: " TRAINING PLAN",
                  ja: "トレーニングプラン",
                })}
              </span>
            </h1>
            <p className="atlas-description phantom-plan-opening">{displayedPlan.opening}</p>
            <p className="phantom-plan-summary-line">{displayedPlan.summary}</p>
            <div className="phantom-diary-meta-line">
              <span>
                {pick({ "zh-CN": "强度：", "zh-TW": "強度：", en: "Intensity: ", ja: "強度：" })}
                <strong>{displayedPlan.intensity}</strong>
              </span>
              <span>
                {pick({ "zh-CN": "难度调节：", "zh-TW": "難度調節：", en: "Difficulty tweak: ", ja: "難易度：" })}
                <strong>{offsetLabel}</strong>
              </span>
            </div>
            <div className="phantom-diary-action-row">
              <button
                type="button"
                className="atlas-home-cta phantom-diary-action"
                onClick={() => void handleRegenerate()}
                disabled={isEnhancingPlan}
              >
                <RefreshCw className={`h-4 w-4${isEnhancingPlan ? " animate-spin" : ""}`} />
                <span>{pick({ "zh-CN": "重新生成", "zh-TW": "重新生成", en: "Regenerate", ja: "再生成" })}</span>
              </button>
              <button
                type="button"
                className="atlas-home-cta phantom-diary-action phantom-diary-action-dark"
                onClick={() => void handleExportPdf()}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                <span>
                  {isExporting
                    ? pick({ "zh-CN": "导出中...", "zh-TW": "導出中...", en: "Exporting...", ja: "出力中..." })
                    : pick({ "zh-CN": "导出 PDF", "zh-TW": "導出 PDF", en: "Export PDF", ja: "PDF出力" })}
                </span>
              </button>
              <div className="phantom-plan-edit-profile-wrap">
                <Link
                  to="/profile?returnTo=/training-plan"
                  className="atlas-home-cta phantom-diary-action phantom-diary-action-dark"
                >
                  <Brain className="h-4 w-4" />
                  <span>
                    {pick({
                      "zh-CN": "编辑个人资料",
                      "zh-TW": "編輯個人資料",
                      en: "Edit Profile",
                      ja: "プロフィール編集",
                    })}
                  </span>
                </Link>
                <p className="phantom-plan-profile-hint">
                  {pick({
                    "zh-CN": "一键生成专属你的训练方案",
                    "zh-TW": "一鍵生成專屬你的訓練方案",
                    en: "One tap for a plan built just for you",
                    ja: "ワンタップであなた専用プラン",
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <AtlasFeatureTabs />

        <section className="phantom-diary-layout">
          <aside className="phantom-diary-sidebar">
            <section className="atlas-panel atlas-knowledge phantom-diary-side-panel">
              <div className="atlas-section-head">
                <p className="atlas-section-tag">HISTORY</p>
                <h2 className="atlas-section-title">
                  {pick({
                    "zh-CN": "方案记录",
                    "zh-TW": "方案記錄",
                    en: "Saved Plans",
                    ja: "保存済みプラン",
                  })}
                </h2>
              </div>
              <div className="phantom-history-list">
                <button
                  type="button"
                  className={`phantom-history-card ${!activeRecordId ? "phantom-history-card-active" : ""}`}
                  onClick={() => setActiveRecordId(null)}
                >
                  <div className="phantom-history-card-top">
                    <span>
                      <History className="inline h-3.5 w-3.5" />{" "}
                      {pick({ "zh-CN": "当前方案", "zh-TW": "當前方案", en: "Current", ja: "現在" })}
                    </span>
                    <span>{format(new Date(), "MM.dd HH:mm")}</span>
                  </div>
                  <p>{livePlan?.summary}</p>
                </button>
                {history.map((record) => {
                  const active = activeRecordId === record.id;
                  return (
                    <div key={record.id} className={`phantom-history-card ${active ? "phantom-history-card-active" : ""}`}>
                      <button type="button" className="phantom-history-card-body" onClick={() => setActiveRecordId(record.id)}>
                        <div className="phantom-history-card-top">
                          <span>{format(new Date(record.createdAt), "yyyy.MM.dd HH:mm")}</span>
                          <span>{ageRangeLabels[record.profileSnapshot.ageRange]}</span>
                        </div>
                        <h3>{record.plan.headline}</h3>
                        <p>{record.plan.summary}</p>
                      </button>
                      <button
                        type="button"
                        className="phantom-plan-history-delete"
                        onClick={() => handleDeleteRecord(record.id)}
                        aria-label={pick({ "zh-CN": "删除", "zh-TW": "刪除", en: "Delete", ja: "削除" })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>

          <div className="phantom-plan-main">
            <section className="atlas-panel atlas-knowledge phantom-plan-personalization">
              <div className="atlas-section-head">
                <p className="atlas-section-tag">COACH</p>
                <h2 className="atlas-section-title">{displayedPlan.personalization.title}</h2>
              </div>
              <div className="phantom-plan-coach-notes">
                {displayedPlan.personalization.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>

            <section className="phantom-plan-grid">
              <PlanSectionCard section={displayedPlan.warmup} />
              <PlanSectionCard section={displayedPlan.technique} />
              <PlanSectionCard section={displayedPlan.conditioning} />
              <PlanSectionCard section={displayedPlan.cooldown} />
            </section>

            <section className="phantom-plan-complete">
              <p className="phantom-plan-closing">{displayedPlan.closing}</p>
              {displayedPlan.praise ? (
                <div className="phantom-plan-praise" aria-label="AI coach praise">
                  <p className="phantom-plan-praise-body">{displayedPlan.praise}</p>
                </div>
              ) : null}
              {todayCompletion ? (
                <div className="phantom-plan-complete-done">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  <div className="phantom-plan-complete-copy">
                    <p>
                      {pick({
                        "zh-CN": "今日训练已记入训练记录。",
                        "zh-TW": "今日訓練已記入訓練記錄。",
                        en: "Today’s session is in your training log.",
                        ja: "今日の練習を記録しました。",
                      })}
                    </p>
                    <div className="phantom-plan-complete-actions">
                      <Link to="/training-log" className="phantom-plan-complete-link">
                        {pick({
                          "zh-CN": "查看训练记录",
                          "zh-TW": "查看訓練記錄",
                          en: "View training log",
                          ja: "練習日誌を見る",
                        })}
                      </Link>
                      {!(activeRecord && !isPlanRecordFromToday(activeRecord)) ? (
                        <button
                          type="button"
                          className="phantom-plan-complete-sync"
                          onClick={() => void handleCompleteSession()}
                          disabled={isCompleting}
                        >
                          {isCompleting
                            ? pick({
                                "zh-CN": "同步中...",
                                "zh-TW": "同步中...",
                                en: "Syncing...",
                                ja: "同期中...",
                              })
                            : pick({
                                "zh-CN": "用当前方案更新记录",
                                "zh-TW": "用當前方案更新記錄",
                                en: "Update log with current plan",
                                ja: "現在のプランで記録を更新",
                              })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="atlas-home-cta phantom-diary-action phantom-plan-complete-btn"
                  onClick={() => void handleCompleteSession()}
                  disabled={
                    isCompleting ||
                    !!(activeRecord && !isPlanRecordFromToday(activeRecord))
                  }
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isCompleting
                      ? pick({
                          "zh-CN": "记录中...",
                          "zh-TW": "記錄中...",
                          en: "Saving...",
                          ja: "保存中...",
                        })
                      : pick({
                          "zh-CN": "完成",
                          "zh-TW": "完成",
                          en: "Complete",
                          ja: "完了",
                        })}
                  </span>
                </button>
              )}
              {activeRecord && !isPlanRecordFromToday(activeRecord) ? (
                <p className="phantom-plan-complete-hint">
                  {pick({
                    "zh-CN": "正在查看历史方案，请切回「当前方案」再点完成。",
                    "zh-TW": "正在查看歷史方案，請切回「當前方案」再點完成。",
                    en: "Viewing a past plan — switch to Current to mark complete.",
                    ja: "履歴表示中。完了するには「現在」に戻ってください。",
                  })}
                </p>
              ) : null}
            </section>

            <section className="atlas-panel atlas-knowledge phantom-plan-difficulty">
              <p className="atlas-section-tag">
                {pick({ "zh-CN": "练完反馈", "zh-TW": "練完回饋", en: "After session", ja: "終わったら" })}
              </p>
              <div className="phantom-plan-difficulty-row">
                <button
                  type="button"
                  className="atlas-home-cta phantom-diary-action phantom-plan-difficulty-btn"
                  onClick={() => handleDifficultyChange("easier")}
                  disabled={difficultyOffset <= -2}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>
                    {pick({
                      "zh-CN": "今天太难了，调简单一点",
                      "zh-TW": "今天太難了，調簡單一點",
                      en: "Too hard today — ease up",
                      ja: "今日はキツい、少し易しく",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  className="atlas-home-cta phantom-diary-action phantom-plan-difficulty-btn"
                  onClick={() => handleDifficultyChange("harder")}
                  disabled={difficultyOffset >= 2}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span>
                    {pick({
                      "zh-CN": "太轻松了，想再挑战一点",
                      "zh-TW": "太輕鬆了，想再挑戰一點",
                      en: "Too easy — push harder",
                      ja: "余裕がある、もう少し難しく",
                    })}
                  </span>
                </button>
              </div>
              {activeRecordId ? (
                <p className="phantom-plan-difficulty-hint">
                  {pick({
                    "zh-CN": "正在查看历史方案。调节难度将回到「当前方案」并重新生成。",
                    "zh-TW": "正在查看歷史方案。調節難度將回到「當前方案」並重新生成。",
                    en: "Viewing a saved plan. Adjusting difficulty switches to current plan and regenerates.",
                    ja: "履歴を表示中。難易度変更で現行プランに戻り再生成します。",
                  })}
                </p>
              ) : null}
            </section>
          </div>
        </section>

        <div className="phantom-pdf-capture-host" aria-hidden="true">
          <div ref={exportRef}>
            <TrainingPlanPdfSheet
              plan={displayedPlan}
              exportTitle={exportTitle}
              identityLabel={currentIdentityLabel}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default TrainingPlan;