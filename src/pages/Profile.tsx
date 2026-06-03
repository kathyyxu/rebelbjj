import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Save, UserRound } from "lucide-react";
import { AtlasFeatureTabs } from "@/components/AtlasFeatureTabs";
import { useIdentity } from "@/lib/identity";
import { useLocale } from "@/lib/locale";
import { toast } from "@/components/ui/sonner";
import {
  AGE_RANGES,
  BELT_LEVELS,
  createEmptyProfileDraft,
  draftToProfile,
  GENDERS,
  profileToDraft,
  readUserProfile,
  MENSTRUAL_PHASES,
  RECENT_FEELINGS,
  saveUserProfile,
  TRAINING_GOALS,
  UserProfileDraft,
  WEEKLY_FREQUENCIES,
} from "@/lib/userProfile";

const Profile = () => {
  const { pick } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { storageScope, hasEmailIdentity, hasWalletIdentity } = useIdentity();
  const [draft, setDraft] = useState<UserProfileDraft>(() => {
    const existing = readUserProfile(storageScope);
    return existing ? profileToDraft(existing) : createEmptyProfileDraft();
  });
  const [isScopeReady, setIsScopeReady] = useState(true);

  const returnTo = searchParams.get("returnTo") === "/training-plan" ? "/training-plan" : null;
  const isLoggedIn = hasEmailIdentity || hasWalletIdentity;

  useEffect(() => {
    setIsScopeReady(false);
    const existing = readUserProfile(storageScope);
    setDraft(existing ? profileToDraft(existing) : createEmptyProfileDraft());
    setIsScopeReady(true);
  }, [storageScope]);

  const ageRangeLabels = {
    "12-17": pick({ "zh-CN": "12–17 岁", "zh-TW": "12–17 歲", en: "12–17", ja: "12–17歳" }),
    "18-24": pick({ "zh-CN": "18–24 岁", "zh-TW": "18–24 歲", en: "18–24", ja: "18–24歳" }),
    "25-29": pick({ "zh-CN": "25–29 岁", "zh-TW": "25–29 歲", en: "25–29", ja: "25–29歳" }),
    "30-34": pick({ "zh-CN": "30–34 岁", "zh-TW": "30–34 歲", en: "30–34", ja: "30–34歳" }),
    "35-39": pick({ "zh-CN": "35–39 岁", "zh-TW": "35–39 歲", en: "35–39", ja: "35–39歳" }),
    "40-44": pick({ "zh-CN": "40–44 岁", "zh-TW": "40–44 歲", en: "40–44", ja: "40–44歳" }),
    "45-49": pick({ "zh-CN": "45–49 岁", "zh-TW": "45–49 歲", en: "45–49", ja: "45–49歳" }),
    "50plus": pick({ "zh-CN": "50 岁及以上", "zh-TW": "50 歲及以上", en: "50+", ja: "50歳以上" }),
  } as const;

  const beltLabels = {
    white: pick({ "zh-CN": "白带", "zh-TW": "白帶", en: "White", ja: "白帯" }),
    blue: pick({ "zh-CN": "蓝带", "zh-TW": "藍帶", en: "Blue", ja: "青帯" }),
    purple: pick({ "zh-CN": "紫带", "zh-TW": "紫帶", en: "Purple", ja: "紫帯" }),
    brown: pick({ "zh-CN": "棕带", "zh-TW": "棕帶", en: "Brown", ja: "茶帯" }),
    black: pick({ "zh-CN": "黑带", "zh-TW": "黑帶", en: "Black", ja: "黒帯" }),
  } as const;

  const genderLabels = {
    female: pick({ "zh-CN": "女", "zh-TW": "女", en: "Female", ja: "女性" }),
    male: pick({ "zh-CN": "男", "zh-TW": "男", en: "Male", ja: "男性" }),
    undisclosed: pick({
      "zh-CN": "不愿透露",
      "zh-TW": "不願透露",
      en: "Prefer not to say",
      ja: "回答しない",
    }),
  } as const;

  const frequencyLabels = {
    "1": pick({ "zh-CN": "每周 1 次", "zh-TW": "每週 1 次", en: "1× / week", ja: "週1回" }),
    "2": pick({ "zh-CN": "每周 2 次", "zh-TW": "每週 2 次", en: "2× / week", ja: "週2回" }),
    "3": pick({ "zh-CN": "每周 3 次", "zh-TW": "每週 3 次", en: "3× / week", ja: "週3回" }),
    "4plus": pick({
      "zh-CN": "每周 4 次以上",
      "zh-TW": "每週 4 次以上",
      en: "4+ / week",
      ja: "週4回以上",
    }),
  } as const;

  const goalLabels = {
    competition: pick({ "zh-CN": "备赛", "zh-TW": "備賽", en: "Competition prep", ja: "試合準備" }),
    improvement: pick({
      "zh-CN": "日常精进",
      "zh-TW": "日常精進",
      en: "Daily improvement",
      ja: "日々の上達",
    }),
    "fat-loss": pick({
      "zh-CN": "减脂塑形",
      "zh-TW": "減脂塑形",
      en: "Fat loss & conditioning",
      ja: "減量・体づくり",
    }),
    recovery: pick({
      "zh-CN": "恢复调整",
      "zh-TW": "恢復調整",
      en: "Recovery block",
      ja: "回復期",
    }),
    health: pick({
      "zh-CN": "综合健康",
      "zh-TW": "綜合健康",
      en: "General health",
      ja: "総合的な健康",
    }),
  } as const;

  const feelingLabels = {
    energetic: pick({ "zh-CN": "精力好", "zh-TW": "精力好", en: "Energized", ja: "好調" }),
    normal: pick({ "zh-CN": "一般", "zh-TW": "一般", en: "Normal", ja: "普通" }),
    tired: pick({ "zh-CN": "疲惫", "zh-TW": "疲憊", en: "Tired", ja: "疲労" }),
  } as const;

  const menstrualPhaseLabels = {
    月经期: pick({ "zh-CN": "月经期", "zh-TW": "月經期", en: "Menstrual", ja: "月経期" }),
    卵泡期: pick({ "zh-CN": "卵泡期", "zh-TW": "卵泡期", en: "Follicular", ja: "卵胞期" }),
    排卵期: pick({ "zh-CN": "排卵期", "zh-TW": "排卵期", en: "Ovulatory", ja: "排卵期" }),
    黄体期: pick({ "zh-CN": "黄体期", "zh-TW": "黃體期", en: "Luteal", ja: "黄体期" }),
  } as const;

  const updateDraft = <K extends keyof UserProfileDraft>(key: K, value: UserProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profile = draftToProfile(draft);
    if (!profile) {
      toast.error(
        pick({
          "zh-CN": "请填写所有必填项，并确认数值在合理范围内。",
          "zh-TW": "請填寫所有必填項，並確認數值在合理範圍內。",
          en: "Fill all required fields and check values are in range.",
          ja: "必須項目を入力し、数値が範囲内か確認してください。",
        }),
      );
      return;
    }

    if (!isScopeReady) return;
    saveUserProfile(profile, storageScope);
    toast.success(
      pick({
        "zh-CN": "个人资料已保存。",
        "zh-TW": "個人資料已儲存。",
        en: "Profile saved.",
        ja: "プロフィールを保存しました。",
      }),
    );

    if (returnTo) {
      navigate(returnTo);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="atlas-app">
        <div className="atlas-shell">
          <header className="atlas-hero atlas-panel">
            <div className="atlas-hero-copy">
              <div className="atlas-chip">PROFILE</div>
              <h1 className="atlas-title">
                {pick({
                  "zh-CN": "个人资料",
                  "zh-TW": "個人資料",
                  en: "Profile",
                  ja: "プロフィール",
                })}
              </h1>
              <p className="atlas-description">
                {pick({
                  "zh-CN": "请先通过顶部邮箱或钱包登录，再填写训练资料。",
                  "zh-TW": "請先透過頂部信箱或錢包登入，再填寫訓練資料。",
                  en: "Sign in with email or wallet in the top bar before saving your profile.",
                  ja: "上部バーでメールまたはウォレット接続後、プロフィールを入力してください。",
                })}
              </p>
            </div>
          </header>
          <AtlasFeatureTabs />
        </div>
      </main>
    );
  }

  return (
    <main className="atlas-app phantom-diary-stage">
      <div className="atlas-shell">
        <header className="atlas-hero atlas-panel">
          <div className="atlas-hero-copy">
            <div className="atlas-chip">ATHLETE PROFILE</div>
            <h1 className="atlas-title persona-page-title">
              {pick({
                "zh-CN": "个人",
                "zh-TW": "個人",
                en: "TRAINING",
                ja: "トレーニング",
              })}
              <span>
                {pick({
                  "zh-CN": "资料",
                  "zh-TW": "資料",
                  en: " PROFILE",
                  ja: "プロフィール",
                })}
              </span>
            </h1>
            <p className="atlas-description">
              {pick({
                "zh-CN": "填写身体与训练目标信息，供 AI 教练训练方案使用。资料仅保存在本设备。",
                "zh-TW": "填寫身體與訓練目標資訊，供 AI 教練訓練方案使用。資料僅保存在本裝置。",
                en: "Body stats and goals for your AI coach training plan. Stored on this device only.",
                ja: "AIコーチ・トレーニングプラン用の身体・目標情報。この端末のみに保存。",
              })}
            </p>
            {returnTo ? (
              <p className="phantom-diary-meta-line">
                {pick({
                  "zh-CN": "保存后将返回训练方案页。",
                  "zh-TW": "儲存後將返回訓練方案頁。",
                  en: "You will return to the training plan after saving.",
                  ja: "保存後、トレーニングプランへ戻ります。",
                })}
              </p>
            ) : null}
          </div>
        </header>

        <AtlasFeatureTabs />

        <section className="atlas-panel atlas-knowledge phantom-diary-form-panel">
          <form className="phantom-diary-form" onSubmit={handleSubmit}>
            <div className="phantom-field-grid phantom-field-grid-three">
              <label className="phantom-field">
                <span>
                  {pick({
                    "zh-CN": "年龄区间 *",
                    "zh-TW": "年齡區間 *",
                    en: "Age range *",
                    ja: "年齢層 *",
                  })}
                </span>
                <select
                  value={draft.ageRange}
                  onChange={(e) =>
                    updateDraft("ageRange", e.target.value as UserProfileDraft["ageRange"])
                  }
                  required
                >
                  <option value="">{pick({ "zh-CN": "请选择", "zh-TW": "請選擇", en: "Select", ja: "選択" })}</option>
                  {AGE_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {ageRangeLabels[range]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="phantom-field">
                <span>{pick({ "zh-CN": "性别 *", "zh-TW": "性別 *", en: "Gender *", ja: "性別 *" })}</span>
                <select
                  value={draft.gender}
                  onChange={(e) => {
                    const gender = e.target.value as UserProfileDraft["gender"];
                    setDraft((prev) => ({
                      ...prev,
                      gender,
                      menstrualPhase: gender === "female" ? prev.menstrualPhase : "",
                    }));
                  }}
                  required
                >
                  <option value="">{pick({ "zh-CN": "请选择", "zh-TW": "請選擇", en: "Select", ja: "選択" })}</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {genderLabels[g]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="phantom-field">
                <span>{pick({ "zh-CN": "腰带 *", "zh-TW": "腰帶 *", en: "Belt *", ja: "帯 *" })}</span>
                <select
                  value={draft.belt}
                  onChange={(e) => updateDraft("belt", e.target.value as UserProfileDraft["belt"])}
                  required
                >
                  <option value="">{pick({ "zh-CN": "请选择", "zh-TW": "請選擇", en: "Select", ja: "選択" })}</option>
                  {BELT_LEVELS.map((b) => (
                    <option key={b} value={b}>
                      {beltLabels[b]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="phantom-field-grid phantom-field-grid-three">
              <label className="phantom-field">
                <span>
                  {pick({ "zh-CN": "身高 (cm) *", "zh-TW": "身高 (cm) *", en: "Height (cm) *", ja: "身長 (cm) *" })}
                </span>
                <input
                  type="number"
                  min="120"
                  max="220"
                  value={draft.heightCm}
                  onChange={(e) => updateDraft("heightCm", e.target.value)}
                  required
                />
              </label>
              <label className="phantom-field">
                <span>
                  {pick({ "zh-CN": "体重 (kg) *", "zh-TW": "體重 (kg) *", en: "Weight (kg) *", ja: "体重 (kg) *" })}
                </span>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={draft.weightKg}
                  onChange={(e) => updateDraft("weightKg", e.target.value)}
                  required
                />
              </label>
              <label className="phantom-field">
                <span>
                  {pick({
                    "zh-CN": "每周训练频率 *",
                    "zh-TW": "每週訓練頻率 *",
                    en: "Weekly frequency *",
                    ja: "週の練習頻度 *",
                  })}
                </span>
                <select
                  value={draft.weeklyFrequency}
                  onChange={(e) =>
                    updateDraft("weeklyFrequency", e.target.value as UserProfileDraft["weeklyFrequency"])
                  }
                  required
                >
                  <option value="">{pick({ "zh-CN": "请选择", "zh-TW": "請選擇", en: "Select", ja: "選択" })}</option>
                  {WEEKLY_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {frequencyLabels[f]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="phantom-field">
              <span>
                {pick({
                  "zh-CN": "当前训练目标 *",
                  "zh-TW": "當前訓練目標 *",
                  en: "Current training goal *",
                  ja: "現在の目標 *",
                })}
              </span>
              <select
                value={draft.goal}
                onChange={(e) => updateDraft("goal", e.target.value as UserProfileDraft["goal"])}
                required
              >
                <option value="">{pick({ "zh-CN": "请选择", "zh-TW": "請選擇", en: "Select", ja: "選択" })}</option>
                {TRAINING_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {goalLabels[g]}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={`phantom-field-grid ${draft.gender === "female" ? "phantom-field-grid-two" : ""}`}
            >
              <label className="phantom-field">
                <span>
                  {pick({
                    "zh-CN": "今日感受",
                    "zh-TW": "今日感受",
                    en: "How you feel today",
                    ja: "今日のコンディション",
                  })}
                </span>
                <select
                  value={draft.recentFeeling}
                  onChange={(e) =>
                    updateDraft("recentFeeling", e.target.value as UserProfileDraft["recentFeeling"])
                  }
                >
                  <option value="">
                    {pick({ "zh-CN": "未选择", "zh-TW": "未選擇", en: "Not set", ja: "未選択" })}
                  </option>
                  {RECENT_FEELINGS.map((f) => (
                    <option key={f} value={f}>
                      {feelingLabels[f]}
                    </option>
                  ))}
                </select>
              </label>

              {draft.gender === "female" ? (
                <label className="phantom-field">
                  <span>
                    {pick({
                      "zh-CN": "生理周期",
                      "zh-TW": "生理週期",
                      en: "Cycle phase",
                      ja: "生理周期",
                    })}
                  </span>
                  <select
                    value={draft.menstrualPhase}
                    onChange={(e) =>
                      updateDraft(
                        "menstrualPhase",
                        e.target.value as UserProfileDraft["menstrualPhase"],
                      )
                    }
                  >
                    <option value="">
                      {pick({ "zh-CN": "未选择", "zh-TW": "未選擇", en: "Not set", ja: "未選択" })}
                    </option>
                    {MENSTRUAL_PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {menstrualPhaseLabels[phase]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="phantom-diary-action-row">
              <button type="submit" className="atlas-home-cta phantom-diary-action">
                <Save className="h-4 w-4" />
                <span>{pick({ "zh-CN": "保存资料", "zh-TW": "儲存資料", en: "Save Profile", ja: "保存" })}</span>
              </button>
              <Link to="/training-plan" className="atlas-home-cta phantom-diary-action phantom-diary-action-dark">
                <UserRound className="h-4 w-4" />
                <span>
                  {pick({
                    "zh-CN": "查看训练方案",
                    "zh-TW": "查看訓練方案",
                    en: "View Training Plan",
                    ja: "プランを見る",
                  })}
                </span>
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Profile;