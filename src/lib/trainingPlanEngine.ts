import { AppLocale, pickLocaleValue } from "@/lib/locale";
import { MenstrualPhase } from "@/lib/trainingLogs";
import {
  AgeRange,
  ageRangeToRepresentativeAge,
  BeltLevel,
  isSeniorAgeRange,
  RecentFeeling,
  TrainingGoal,
  UserProfile,
  WeeklyFrequency,
} from "@/lib/userProfile";

export type PlanDifficultyOffset = -2 | -1 | 0 | 1 | 2;

export type TrainingPlanSection = {
  title: string;
  durationLabel?: string;
  items: string[];
  note?: string;
};

export type TrainingPlanResult = {
  headline: string;
  opening: string;
  closing: string;
  summary: string;
  intensity: string;
  intensityScore: number;
  difficultyOffset: PlanDifficultyOffset;
  personalization: {
    title: string;
    items: string[];
  };
  warmup: TrainingPlanSection;
  technique: TrainingPlanSection;
  conditioning: TrainingPlanSection;
  cooldown: TrainingPlanSection;
};

type LocaleVariants<T> = Partial<Record<AppLocale, T>> & { "zh-CN": T };

const t = <T,>(locale: AppLocale, variants: LocaleVariants<T>) =>
  pickLocaleValue(locale, variants);

const clampOffset = (value: number): PlanDifficultyOffset => {
  if (value <= -2) return -2;
  if (value >= 2) return 2;
  return value as PlanDifficultyOffset;
};

export const adjustDifficultyOffset = (
  current: PlanDifficultyOffset,
  direction: "easier" | "harder",
): PlanDifficultyOffset =>
  clampOffset(current + (direction === "harder" ? 1 : -1));

type PlanContext = {
  locale: AppLocale;
  profile: UserProfile;
  offset: PlanDifficultyOffset;
  repAge: number;
  ageLabel: string;
  beltLabel: string;
  goalLabel: string;
  freqLabel: string;
  feelingLabel: string | null;
  menstrualPhaseLabel: string | null;
  cycleMenstrual: boolean;
  cycleLuteal: boolean;
  senior: boolean;
  tired: boolean;
  energetic: boolean;
  baseScore: number;
  finalScore: number;
};

const beltLabel = (belt: BeltLevel, locale: AppLocale) =>
  ({
    white: t(locale, { "zh-CN": "白带", "zh-TW": "白帶", en: "white belt", ja: "白帯" }),
    blue: t(locale, { "zh-CN": "蓝带", "zh-TW": "藍帶", en: "blue belt", ja: "青帯" }),
    purple: t(locale, { "zh-CN": "紫带", "zh-TW": "紫帶", en: "purple belt", ja: "紫帯" }),
    brown: t(locale, { "zh-CN": "棕带", "zh-TW": "棕帶", en: "brown belt", ja: "茶帯" }),
    black: t(locale, { "zh-CN": "黑带", "zh-TW": "黑帶", en: "black belt", ja: "黒帯" }),
  })[belt];

const goalLabel = (goal: TrainingGoal, locale: AppLocale) =>
  ({
    competition: t(locale, { "zh-CN": "备赛", "zh-TW": "備賽", en: "competition prep", ja: "試合準備" }),
    improvement: t(locale, { "zh-CN": "日常精进", "zh-TW": "日常精進", en: "daily improvement", ja: "日々の上達" }),
    "fat-loss": t(locale, { "zh-CN": "减脂塑形", "zh-TW": "減脂塑形", en: "fat loss", ja: "減量" }),
    recovery: t(locale, { "zh-CN": "恢复调整", "zh-TW": "恢復調整", en: "recovery", ja: "回復" }),
    health: t(locale, { "zh-CN": "综合健康", "zh-TW": "綜合健康", en: "general health", ja: "総合健康" }),
  })[goal];

const frequencyLabel = (frequency: WeeklyFrequency, locale: AppLocale) => {
  const n = frequency === "4plus" ? "4" : frequency;
  return t(locale, {
    "zh-CN": `每周练 ${n} 次`,
    "zh-TW": `每週練 ${n} 次`,
    en: `${n} sessions a week`,
    ja: `週${n}回`,
  });
};

const ageRangeLabel = (range: AgeRange, locale: AppLocale) =>
  ({
    "12-17": t(locale, { "zh-CN": "12 到 17 岁", "zh-TW": "12 到 17 歲", en: "12 to 17", ja: "12〜17歳" }),
    "18-24": t(locale, { "zh-CN": "18 到 24 岁", "zh-TW": "18 到 24 歲", en: "18 to 24", ja: "18〜24歳" }),
    "25-29": t(locale, { "zh-CN": "25 到 29 岁", "zh-TW": "25 到 29 歲", en: "25 to 29", ja: "25〜29歳" }),
    "30-34": t(locale, { "zh-CN": "30 到 34 岁", "zh-TW": "30 到 34 歲", en: "30 to 34", ja: "30〜34歳" }),
    "35-39": t(locale, { "zh-CN": "35 到 39 岁", "zh-TW": "35 到 39 歲", en: "35 to 39", ja: "35〜39歳" }),
    "40-44": t(locale, { "zh-CN": "40 到 44 岁", "zh-TW": "40 到 44 歲", en: "40 to 44", ja: "40〜44歳" }),
    "45-49": t(locale, { "zh-CN": "45 到 49 岁", "zh-TW": "45 到 49 歲", en: "45 to 49", ja: "45〜49歳" }),
    "50plus": t(locale, { "zh-CN": "50 岁以上", "zh-TW": "50 歲以上", en: "50 and up", ja: "50歳以上" }),
  })[range];

const feelingLabel = (feeling: RecentFeeling, locale: AppLocale) =>
  ({
    energetic: t(locale, { "zh-CN": "精力好", "zh-TW": "精力好", en: "feeling good", ja: "好調" }),
    normal: t(locale, { "zh-CN": "状态一般", "zh-TW": "狀態一般", en: "doing okay", ja: "普通" }),
    tired: t(locale, { "zh-CN": "疲惫", "zh-TW": "疲憊", en: "tired", ja: "疲れ気味" }),
  })[feeling];

const menstrualPhaseLabel = (phase: MenstrualPhase, locale: AppLocale) =>
  ({
    月经期: t(locale, { "zh-CN": "月经期", "zh-TW": "月經期", en: "menstrual phase", ja: "月経期" }),
    卵泡期: t(locale, { "zh-CN": "卵泡期", "zh-TW": "卵泡期", en: "follicular phase", ja: "卵胞期" }),
    排卵期: t(locale, { "zh-CN": "排卵期", "zh-TW": "排卵期", en: "ovulatory phase", ja: "排卵期" }),
    黄体期: t(locale, { "zh-CN": "黄体期", "zh-TW": "黃體期", en: "luteal phase", ja: "黄体期" }),
  })[phase];

const buildContext = (
  profile: UserProfile,
  locale: AppLocale,
  offset: PlanDifficultyOffset,
): PlanContext => {
  const goalScore: Record<TrainingGoal, number> = {
    competition: 22,
    "fat-loss": 16,
    improvement: 10,
    health: 4,
    recovery: -18,
  };
  const freqScore: Record<WeeklyFrequency, number> = {
    "1": -6,
    "2": 0,
    "3": 6,
    "4plus": 12,
  };
  const feelingScore: Record<RecentFeeling, number> = {
    energetic: 14,
    normal: 0,
    tired: -22,
  };
  const menstrualScore: Record<MenstrualPhase, number> = {
    月经期: -18,
    卵泡期: 2,
    排卵期: 5,
    黄体期: -10,
  };

  const activeMenstrualPhase =
    profile.gender === "female" ? profile.menstrualPhase : undefined;

  const baseScore =
    50 +
    goalScore[profile.goal] +
    freqScore[profile.weeklyFrequency] +
    (profile.recentFeeling ? feelingScore[profile.recentFeeling] : 0) +
    (activeMenstrualPhase ? menstrualScore[activeMenstrualPhase] : 0) +
    (isSeniorAgeRange(profile.ageRange) ? -6 : 0);

  const finalScore = Math.max(15, Math.min(95, baseScore + offset * 12));
  const cycleMenstrual = activeMenstrualPhase === "月经期";
  const cycleLuteal = activeMenstrualPhase === "黄体期";

  return {
    locale,
    profile,
    offset,
    repAge: ageRangeToRepresentativeAge(profile.ageRange),
    ageLabel: ageRangeLabel(profile.ageRange, locale),
    beltLabel: beltLabel(profile.belt, locale),
    goalLabel: goalLabel(profile.goal, locale),
    freqLabel: frequencyLabel(profile.weeklyFrequency, locale),
    feelingLabel: profile.recentFeeling ? feelingLabel(profile.recentFeeling, locale) : null,
    menstrualPhaseLabel: activeMenstrualPhase
      ? menstrualPhaseLabel(activeMenstrualPhase, locale)
      : null,
    cycleMenstrual,
    cycleLuteal,
    senior: isSeniorAgeRange(profile.ageRange),
    tired:
      profile.recentFeeling === "tired" ||
      cycleMenstrual ||
      (cycleLuteal && profile.recentFeeling !== "energetic"),
    energetic: profile.recentFeeling === "energetic",
    baseScore,
    finalScore,
  };
};

const intensityLabel = (ctx: PlanContext) => {
  const { locale, finalScore, offset } = ctx;
  if (finalScore >= 78) {
    return t(locale, {
      "zh-CN": offset > 0 ? "今天会偏累一点（你往上调了强度）" : "今天会偏累一点",
      "zh-TW": offset > 0 ? "今天會偏累一點（你往上調了強度）" : "今天會偏累一點",
      en: offset > 0 ? "Heavier day — you asked for more" : "Heavier day",
      ja: offset > 0 ? "今日はややハード（アップ調整済み）" : "今日はややハード",
    });
  }
  if (finalScore >= 58) {
    return t(locale, {
      "zh-CN": "强度适中，能练透",
      "zh-TW": "強度適中，能練透",
      en: "Moderate — good training density",
      ja: "ちょうど良い強度",
    });
  }
  return t(locale, {
    "zh-CN": offset < 0 ? "今天轻松一点（你往下调了强度）" : "今天轻松一点，重在恢复",
    "zh-TW": offset < 0 ? "今天輕鬆一點（你往下調了強度）" : "今天輕鬆一點，重在恢復",
    en: offset < 0 ? "Lighter day — you asked for easier" : "Lighter day, recovery focus",
    ja: offset < 0 ? "今日は軽め（ダウン調整済み）" : "今日は軽め、回復中心",
  });
};

const computeWarmupMinutes = (ctx: PlanContext) => {
  let minutes = 4;
  if (ctx.senior) minutes += 3;
  if (ctx.tired) minutes -= 1;
  if (ctx.energetic && ctx.finalScore >= 60) minutes += 1;
  if (ctx.profile.goal === "competition") minutes += 1;
  minutes += ctx.offset;
  return Math.max(3, Math.min(10, minutes));
};

const computeConditioningSets = (ctx: PlanContext) => {
  let sets = 2;
  if (ctx.cycleMenstrual) sets -= 1;
  if (ctx.cycleLuteal && !ctx.energetic) sets -= 1;
  if (ctx.profile.goal === "competition" || ctx.profile.goal === "fat-loss") sets += 1;
  if (ctx.profile.goal === "recovery" || ctx.profile.goal === "health") sets -= 1;
  if (ctx.tired) sets -= 1;
  if (ctx.energetic && ctx.profile.weeklyFrequency === "4plus") sets += 1;
  sets += ctx.offset;
  return Math.max(1, Math.min(4, sets));
};

const computeStretchMinutes = (ctx: PlanContext) => {
  let minutes = 5;
  if (ctx.senior) minutes += 3;
  if (ctx.tired) minutes += 2;
  minutes += Math.max(0, -ctx.offset);
  return Math.max(5, Math.min(12, minutes));
};

const computeSessionMinutes = (ctx: PlanContext) => {
  const warmup = computeWarmupMinutes(ctx);
  const stretch = computeStretchMinutes(ctx);
  const sets = computeConditioningSets(ctx);
  const total = warmup + stretch + sets * 6 + 32;
  return Math.max(45, Math.round(total / 5) * 5);
};

const difficultyTweakLine = (ctx: PlanContext, kind: "warmup" | "conditioning") => {
  if (ctx.offset === 0) return null;
  const { locale, offset } = ctx;
  if (kind === "warmup") {
    return offset > 0
      ? t(locale, {
          "zh-CN": `你点了「更难」，热身给你多留了 ${offset} 分钟。`,
          "zh-TW": `你點了「更難」，熱身多留了 ${offset} 分鐘。`,
          en: `You asked for harder — warm-up gets ${offset} extra minutes.`,
          ja: `「もっと難しく」に合わせてウォームアップを${offset}分追加。`,
        })
      : t(locale, {
          "zh-CN": `你点了「更简单」，热身稍微缩短一点。`,
          "zh-TW": `你點了「更簡單」，熱身稍微縮短一點。`,
          en: `You asked for easier — warm-up trimmed a bit.`,
          ja: `「もっと易しく」に合わせてウォームアップを短く。`,
        });
  }
  return offset > 0
    ? t(locale, {
        "zh-CN": `你点了「更难」，好，今天体能多加 ${offset} 组。`,
        "zh-TW": `你點了「更難」，好，今天體能多加 ${offset} 組。`,
        en: `You asked for harder — adding ${offset} conditioning set(s) today.`,
        ja: `「もっと難しく」— コンディションを${offset}セット追加。`,
      })
    : t(locale, {
        "zh-CN": `你点了「更简单」，体能组数减到 ${computeConditioningSets(ctx)} 组，留点力气给技术。`,
        "zh-TW": `你點了「更簡單」，體能組數減到 ${computeConditioningSets(ctx)} 組，留點力氣給技術。`,
        en: `You asked for easier — ${computeConditioningSets(ctx)} conditioning sets, save energy for technique.`,
        ja: `「もっと易しく」— コンディションは${computeConditioningSets(ctx)}セットに。`,
      });
};

const buildTechniqueBlock = (ctx: PlanContext): TrainingPlanSection => {
  const { locale, profile } = ctx;
  const lowFreq = profile.weeklyFrequency === "1" || profile.weeklyFrequency === "2";
  const hard = ctx.finalScore >= 70;

  if (profile.belt === "white") {
    return {
      title: t(locale, {
        "zh-CN": "今天练什么",
        "zh-TW": "今天練什麼",
        en: "Technique block",
        ja: "今日の技",
      }),
      items: [
        t(locale, {
          "zh-CN": "白带阶段，先学会逃出去比压住更重要。今天从侧压逃脱开始。",
          "zh-TW": "白帶階段，先學會逃出去比壓住更重要。今天從側壓逃脫開始。",
          en: "White belt: getting out matters more than holding people down. Start with side control escapes.",
          ja: "白帯は脱出が先。今日はサイドから。",
        }),
        t(locale, {
          "zh-CN": "侧压逃脱 6 组：每组先肘膝框架到位，再虾行，别急着推人。",
          "zh-TW": "側壓逃脫 6 組：每組先肘膝框架到位，再蝦行，別急著推人。",
          en: "Side escape × 6: frame first, shrimp second — don’t muscle through.",
          ja: "サイド脱出6セット：フレームしてからシュリンプ。",
        }),
        t(locale, {
          "zh-CN": lowFreq
            ? "骑乘逃脱 4 组：你这周上垫不多，每组做干净比做满更重要。"
            : "骑乘逃脱 5 组，再加半防守恢复 5 组：练一条「被压了也能回到防守」的路线。",
          "zh-TW": lowFreq
            ? "騎乘逃脫 4 組：這週上墊不多，每組做乾淨比做滿更重要。"
            : "騎乘逃脫 5 組，再加半防守恢復 5 組：練一條「被壓了也能回到防守」的路線。",
          en: lowFreq
            ? "Mount escape × 4: fewer days on the mat this week — quality over volume."
            : "Mount escape × 5, then half guard recovery × 5: one clean path back to guard.",
          ja: lowFreq
            ? "マウント脱出4セット：週回数少なめ、質を優先。"
            : "マウント5＋ハーフ回復5：ガードに戻る一本道。",
        }),
      ],
    };
  }

  if (profile.belt === "blue" && profile.goal === "competition") {
    return {
      title: t(locale, {
        "zh-CN": "今天练什么",
        "zh-TW": "今天練什麼",
        en: "Technique block",
        ja: "今日の技",
      }),
      items: [
        t(locale, {
          "zh-CN": hard
            ? "蓝带备赛期，今天上扫技和过腿组合，强度会高一点，但别乱。"
            : "蓝带备赛期，今天先练扫技和过腿，把进入做稳再提速。",
          "zh-TW": hard
            ? "藍帶備賽期，今天上掃技和過腿組合，強度會高一點，但別亂。"
            : "藍帶備賽期，今天先練掃技和過腿，把進入做穩再提速。",
          en: hard
            ? "Blue belt, comp season: sweeps and passes today — a bit spicy, stay sharp."
            : "Blue belt, comp season: sweeps and passes — nail entries before speed.",
          ja: hard
            ? "青帯・試合前：スイープとパス、今日は少し強め。"
            : "青帯・試合前：スイープとパス、入りを固めてから。",
        }),
        t(locale, {
          "zh-CN": `蝴蝶扫接起身过腿 ${hard ? "5" : "4"} 组：每组只盯一件事，重心换过去没有。`,
          "zh-TW": `蝴蝶掃接起身過腿 ${hard ? "5" : "4"} 組：每組只盯一件事，重心換過去沒有。`,
          en: `Butterfly to pass: ${hard ? "5" : "4"} sets — one cue: did your weight shift cleanly?`,
          ja: `バタフライからパス：${hard ? "5" : "4"}セット、重心の移し方だけ見る。`,
        }),
        t(locale, {
          "zh-CN": `德拉扫、膝切过腿各 ${hard ? "4" : "3"} 组，组间歇 ${ctx.senior ? "60" : "45"} 秒。`,
          "zh-TW": `德拉掃、膝切過腿各 ${hard ? "4" : "3"} 組，組間歇 ${ctx.senior ? "60" : "45"} 秒。`,
          en: `DLR and knee cut: ${hard ? "4" : "3"} sets each, ${ctx.senior ? "60" : "45"}s between sets.`,
          ja: `DLRとニーカット各${hard ? "4" : "3"}、休憩${ctx.senior ? "60" : "45"}秒。`,
        }),
      ],
    };
  }

  if (profile.goal === "recovery" || profile.goal === "health") {
    return {
      title: t(locale, {
        "zh-CN": "今天练什么",
        "zh-TW": "今天練什麼",
        en: "Technique block",
        ja: "今日の技",
      }),
      items: [
        t(locale, {
          "zh-CN": "恢复日不上新招，把最熟的两三个动作练顺就好。",
          "zh-TW": "恢復日不上新招，把最熟的兩三個動作練順就好。",
          en: "Recovery day — no new moves. Smooth out what you already know.",
          ja: "回復日は新技なし、得意技をなめらかに。",
        }),
        t(locale, {
          "zh-CN": "慢速 positional 两轮，每轮只练一个位置 5 分钟，滚技六成力就够。",
          "zh-TW": "慢速 positional 兩輪，每輪只練一個位置 5 分鐘，滾技六成力就夠。",
          en: "Slow positional × 2 rounds, one position per round, roll around 60% effort.",
          ja: "スローポジショナル2ラウンド、スパーは6割。",
        }),
        t(locale, {
          "zh-CN": "最熟的两项技术，各 10 次干净重复，练完应该有「更清楚了」的感觉。",
          "zh-TW": "最熟的兩項技術，各 10 次乾淨重複，練完應該有「更清楚了」的感覺。",
          en: "Your two best moves: 10 crisp reps each — finish feeling clearer, not busier.",
          ja: "得意技2つ、各10回キレよく。",
        }),
      ],
    };
  }

  if (profile.goal === "fat-loss") {
    return {
      title: t(locale, {
        "zh-CN": "今天练什么",
        "zh-TW": "今天練什麼",
        en: "Technique block",
        ja: "今日の技",
      }),
      items: [
        t(locale, {
          "zh-CN": "减脂课要多移动。今天 flow 加 guard retention，让心率上来但别崩动作。",
          "zh-TW": "減脂課要多移動。今天 flow 加 guard retention，讓心率上來但別崩動作。",
          en: "Fat-loss days need movement — flow and guard retention, heart rate up, technique intact.",
          ja: "減量日は動き続ける。フローとガードリテンション。",
        }),
        t(locale, {
          "zh-CN": `Flow rolling ${ctx.finalScore >= 65 ? "4" : "3"} 轮，每轮 4 分钟，呼吸乱了先停一轮。`,
          "zh-TW": `Flow rolling ${ctx.finalScore >= 65 ? "4" : "3"} 輪，每輪 4 分鐘，呼吸亂了先停一輪。`,
          en: `Flow rolling ${ctx.finalScore >= 65 ? "4" : "3"} rounds × 4 min — if breath falls apart, skip a round.`,
          ja: `フロー${ctx.finalScore >= 65 ? "4" : "3"}ラウンド、呼吸が崩れたら休む。`,
        }),
      ],
    };
  }

  if (profile.belt === "purple" || profile.belt === "brown" || profile.belt === "black") {
    return {
      title: t(locale, {
        "zh-CN": "今天练什么",
        "zh-TW": "今天練什麼",
        en: "Technique block",
        ja: "今日の技",
      }),
      items: [
        t(locale, {
          "zh-CN": `${ctx.beltLabel}、${ctx.freqLabel}，今天练比赛节奏：A  game 连段和劣势里的翻盘。`,
          "zh-TW": `${ctx.beltLabel}、${ctx.freqLabel}，今天練比賽節奏：A-game 連段和劣勢裡的翻盤。`,
          en: `${ctx.beltLabel}, ${ctx.freqLabel}: comp rhythm — A-game chains and scrambles from bad spots.`,
          ja: `${ctx.beltLabel}・${ctx.freqLabel}：試合リズムとスクランブル。`,
        }),
        t(locale, {
          "zh-CN": "挑两条你最熟的终结路线，每条至少走通一次，走不通记下来晚上看。",
          "zh-TW": "挑兩條你最熟的終結路線，每條至少走通一次，走不通記下來晚上看。",
          en: "Pick two finish chains you trust — land each once; if not, note it for video later.",
          ja: "得意のフィニッシュ2ルート、各1回通す。",
        }),
      ],
    };
  }

  return {
    title: t(locale, {
      "zh-CN": "今天练什么",
      "zh-TW": "今天練什麼",
      en: "Technique block",
      ja: "今日の技",
    }),
    items: [
      t(locale, {
        "zh-CN": "扫技和过腿各 5 组，组间用 30 秒想一个刚才的失误，比闷头重复更有用。",
        "zh-TW": "掃技和過腿各 5 組，組間用 30 秒想一個剛才的失誤，比悶頭重複更有用。",
        en: "Five sweeps, five passes — 30 seconds between sets to name one mistake.",
        ja: "スイープ5、パス5、セット間にミスを1つ言語化。",
      }),
    ],
  };
};

const buildWarmupBlock = (ctx: PlanContext): TrainingPlanSection => {
  const minutes = computeWarmupMinutes(ctx);
  const { locale, profile } = ctx;

  const items: string[] = [];

  if (ctx.senior) {
    items.push(
      t(locale, {
        "zh-CN": `35 岁后关节需要更久激活，热身给你留了 ${minutes} 分钟。`,
        "zh-TW": `35 歲後關節需要更久激活，熱身留了 ${minutes} 分鐘。`,
        en: `Past 35, joints need a longer wake-up — ${minutes} minutes warm-up for you today.`,
        ja: `35歳以降は関節の準備に時間をかける。ウォームアップ${minutes}分。`,
      }),
    );
  } else {
    items.push(
      t(locale, {
        "zh-CN": `先活动开颈肩髋踝，再虾行、桥式，热身一共 ${minutes} 分钟。`,
        "zh-TW": `先活動開頸肩髖踝，再蝦行、橋式，熱身一共 ${minutes} 分鐘。`,
        en: `Open neck, shoulders, hips, ankles, then shrimp and bridge — ${minutes} minutes total.`,
        ja: `首・肩・腰・足首から。合計${minutes}分。`,
      }),
    );
  }

  items.push(
    t(locale, {
      "zh-CN": "虾行、桥式各 10 次，技术起立 5 次，把核心和起身节奏找回来。",
      "zh-TW": "蝦行、橋式各 10 次，技術起立 5 次，把核心和起身節奏找回來。",
      en: "Shrimp and bridge × 10 each, technical stand-up × 5 — wake up core and stand-up rhythm.",
      ja: "シュリンプ・ブリッジ各10、テクニカルスタンドアップ5。",
    }),
  );

  if (ctx.tired) {
    items.push(
      t(locale, {
        "zh-CN": "今天有点累，热身不做冲刺，把呼吸节奏找顺就行。",
        "zh-TW": "今天有點累，熱身不做衝刺，把呼吸節奏找順就行。",
        en: "You’re tired today — no sprints in warm-up, just smooth breathing.",
        ja: "疲れ気味なのでスプリントなし、呼吸を整える。",
      }),
    );
  } else if (ctx.energetic) {
    items.push(
      t(locale, {
        "zh-CN": `状态不错，${ctx.freqLabel}，末尾加一组抢把反应，帮身体进入训练状态。`,
        "zh-TW": `狀態不錯，${ctx.freqLabel}，末尾加一組搶把反應，幫身體進入訓練狀態。`,
        en: `You’re feeling good and training ${ctx.freqLabel} — finish with a short grip-reaction burst.`,
        ja: `好調で${ctx.freqLabel}、最後に組み合い反応を少し。`,
      }),
    );
  }

  if (profile.goal === "competition") {
    items.push(
      t(locale, {
        "zh-CN": "备赛期加 3 组抢把模拟，手速和反应先热起来。",
        "zh-TW": "備賽期加 3 組搶把模擬，手速和反應先熱起來。",
        en: "Comp prep: 3 short grip-fight rounds to switch your hands on.",
        ja: "試合前：組み合いシミュレーション3セット。",
      }),
    );
  }

  const tweak = difficultyTweakLine(ctx, "warmup");
  if (tweak) items.push(tweak);

  return {
    title: t(locale, {
      "zh-CN": "热身",
      "zh-TW": "熱身",
      en: "Warm-up",
      ja: "ウォームアップ",
    }),
    durationLabel: t(locale, {
      "zh-CN": `${minutes} 分钟`,
      "zh-TW": `${minutes} 分鐘`,
      en: `${minutes} min`,
      ja: `${minutes}分`,
    }),
    items,
  };
};

const buildConditioningBlock = (ctx: PlanContext): TrainingPlanSection => {
  const sets = computeConditioningSets(ctx);
  const { locale, profile } = ctx;
  const recoveryGoal = profile.goal === "recovery" || profile.goal === "health";
  const compGoal = profile.goal === "competition" || profile.goal === "fat-loss";

  const items: string[] = [];

  if (ctx.tired) {
    items.push(
      t(locale, {
        "zh-CN": `今天有点累，体能只做 ${sets} 组轻松的，滚技也别硬拼。`,
        "zh-TW": `今天有點累，體能只做 ${sets} 組輕鬆的，滾技也別硬拼。`,
        en: `You’re tired today — only ${sets} easy conditioning sets; don’t grind rolls either.`,
        ja: `疲労気味なのでコンディションは${sets}セット軽め。`,
      }),
      t(locale, {
        "zh-CN": "熊爬 20 米 2 组，慢做；平板 30 秒 2 组，别憋气。",
        "zh-TW": "熊爬 20 米 2 組，慢做；平板 30 秒 2 組，別憋氣。",
        en: "Bear crawl 20m × 2 slow; plank 30s × 2, keep breathing.",
        ja: "ベアクロール20m×2、プランク30秒×2。",
      }),
    );
  } else if (recoveryGoal) {
    items.push(
      t(locale, {
        "zh-CN": `恢复日不上高强度间歇，${sets} 组核心激活，练完应该还有余力。`,
        "zh-TW": `恢復日不上高強度間歇，${sets} 組核心激活，練完應該還有餘力。`,
        en: `Recovery day — ${sets} core sets, no hard intervals. You should leave with gas left.`,
        ja: `回復日はインターバルなし、コア${sets}セット。`,
      }),
      t(locale, {
        "zh-CN": "死虫式每侧 10 次 2 组，侧桥每侧 30 秒。",
        "zh-TW": "死蟲式每側 10 次 2 組，側橋每側 30 秒。",
        en: "Dead bug 10/side × 2; side plank 30s/side.",
        ja: "デッドバグ10/側×2、サイドプランク30秒/側。",
      }),
    );
  } else if (compGoal && ctx.finalScore >= 62) {
    items.push(
      t(locale, {
        "zh-CN":
          ctx.energetic && profile.weeklyFrequency === "4plus"
            ? "这周练了四次以上，状态也好，间歇可以稍微挑战一点，会有点喘，正常。"
            : ctx.profile.goal === "competition"
              ? "你在备赛期，体能今天会多一点，间歇跑下来会有点喘。"
              : "减脂课今天心肺会顶一点，但能撑过去就对。",
        "zh-TW":
          ctx.energetic && profile.weeklyFrequency === "4plus"
            ? "這週練了四次以上，狀態也好，間歇可以稍微挑戰一點，會有點喘，正常。"
            : ctx.profile.goal === "competition"
              ? "你在備賽期，體能今天會多一點，間歇跑下來會有點喘。"
              : "減脂課今天心肺會頂一點，但能撐過去就對。",
        en:
          ctx.energetic && profile.weeklyFrequency === "4plus"
            ? "Four-plus sessions this week and you feel good — intervals can bite a little, that’s fine."
            : ctx.profile.goal === "competition"
              ? "Comp season: a bit more conditioning today — expect to be breathing hard."
              : "Fat-loss day — cardio will push you; that’s the point.",
        ja:
          ctx.energetic && profile.weeklyFrequency === "4plus"
            ? "週4回以上で好調—インターバルは少しキツめでOK。"
            : ctx.profile.goal === "competition"
              ? "試合前—心肺多め、キツくて正常。"
              : "減量日—心肺を上げる日。",
      }),
      t(locale, {
        "zh-CN": `冲刺加虾行：做 20 秒、歇 40 秒，一共 ${sets} 轮。`,
        "zh-TW": `衝刺加蝦行：做 20 秒、歇 40 秒，一共 ${sets} 輪。`,
        en: `Sprint plus shrimp: 20 seconds on, 40 off, ${sets} rounds.`,
        ja: `スプリント＋シュリンプ：20秒オン、40秒オフ、${sets}ラウンド。`,
      }),
    );
  } else {
    items.push(
      t(locale, {
        "zh-CN": `今天体能 ${sets} 组，中等强度，熊爬加螃蟹走，把髋和核心练到就行。`,
        "zh-TW": `今天體能 ${sets} 組，中等強度，熊爬加螃蟹走，把髖和核心練到就行。`,
        en: `${sets} conditioning sets at moderate pace — bear crawl and crab walk, hips and core.`,
        ja: `コンディション${sets}セット、ベアクロールとクラブウォーク。`,
      }),
      t(locale, {
        "zh-CN": "熊爬、螃蟹走各 20 米，做满组数就可以收。",
        "zh-TW": "熊爬、螃蟹走各 20 米，做滿組數就可以收。",
        en: "Bear crawl and crab walk, 20m each — call it when sets are done.",
        ja: "各20m、セット数こなしたらOK。",
      }),
    );
  }

  const tweak = difficultyTweakLine(ctx, "conditioning");
  if (tweak) items.push(tweak);

  return {
    title: t(locale, {
      "zh-CN": "体能",
      "zh-TW": "體能",
      en: "Conditioning",
      ja: "コンディション",
    }),
    items,
  };
};

const buildCooldownBlock = (ctx: PlanContext): TrainingPlanSection => {
  const minutes = computeStretchMinutes(ctx);
  const { locale } = ctx;

  const items = [
    t(locale, {
      "zh-CN": ctx.tired
        ? `练完别急着走，拉伸给你留了 ${minutes} 分钟，髋和下背多照顾一点。`
        : `收尾拉伸 ${minutes} 分钟，练完身体会松很多。`,
      "zh-TW": ctx.tired
        ? `練完別急著走，拉伸留了 ${minutes} 分鐘，髖和下背多照顧一點。`
        : `收尾拉伸 ${minutes} 分鐘，練完身體會鬆很多。`,
      en: ctx.tired
        ? `Don’t rush off — ${minutes} minutes stretch, hips and low back first.`
        : `${minutes} minutes to cool down — you’ll feel looser after.`,
      ja: ctx.tired
        ? `終わったら${minutes}分ストレッチ、腰優先。`
        : `クールダウン${minutes}分。`,
    }),
    t(locale, {
      "zh-CN": "写下今天一个做得好的地方，一个下次想改的点，跟技术课对上号。",
      "zh-TW": "寫下今天一個做得好的地方，一個下次想改的點，跟技術課對上號。",
      en: "Note one thing that worked and one to fix — tie it to today’s technique.",
      ja: "良かった点と直したい点を1つずつメモ。",
    }),
    t(locale, {
      "zh-CN": "髋屈肌每侧 45 秒，婴儿式 1 分钟，慢慢呼吸。",
      "zh-TW": "髖屈肌每側 45 秒，嬰兒式 1 分鐘，慢慢呼吸。",
      en: "Hip flexors 45s/side, child’s pose 1 min, slow breath.",
      ja: "ヒップフレクサー45秒/側、チャイルド1分。",
    }),
  ];

  if (ctx.senior) {
    items.push(
      t(locale, {
        "zh-CN": "小腿和下背再加一分钟，明天起床会舒服很多。",
        "zh-TW": "小腿和下背再加一分鐘，明天起床會舒服很多。",
        en: "Extra minute for calves and lower back — tomorrow will feel better.",
        ja: "ふくらはぎと腰をもう少し。",
      }),
    );
  }

  return {
    title: t(locale, {
      "zh-CN": "拉伸与复盘",
      "zh-TW": "拉伸與複盤",
      en: "Cool-down",
      ja: "クールダウン",
    }),
    durationLabel: t(locale, {
      "zh-CN": `${minutes} 分钟`,
      "zh-TW": `${minutes} 分鐘`,
      en: `${minutes} min`,
      ja: `${minutes}分`,
    }),
    items,
  };
};

const buildPersonalizationPanel = (ctx: PlanContext): TrainingPlanResult["personalization"] => {
  const { locale, profile } = ctx;
  const warmupMin = computeWarmupMinutes(ctx);
  const condSets = computeConditioningSets(ctx);
  const items: string[] = [];

  if (profile.belt === "white") {
    items.push(
      t(locale, {
        "zh-CN": "白带阶段，逃出去比压住更重要。我们先从侧压逃脱开始。",
        "zh-TW": "白帶階段，逃出去比壓住更重要。我們先從側壓逃脫開始。",
        en: "White belt: getting out beats holding people down. We start with side escapes.",
        ja: "白帯は脱出が先。サイドから入る。",
      }),
    );
  } else if (profile.belt === "blue" && profile.goal === "competition") {
    items.push(
      t(locale, {
        "zh-CN": "蓝带又在备赛，扫技和过腿要练到能比赛用，不只是会做。",
        "zh-TW": "藍帶又在備賽，掃技和過腿要練到能比賽用，不只是會做。",
        en: "Blue belt in comp prep — sweeps and passes need to work under pressure, not just in drill.",
        ja: "青帯・試合前。スイープとパスを実戦レベルに。",
      }),
    );
  } else if (profile.goal === "recovery" || profile.goal === "health") {
    items.push(
      t(locale, {
        "zh-CN": "今天在恢复，技术课只复习熟的，给身体一点空间。",
        "zh-TW": "今天在恢復，技術課只複習熟的，給身體一點空間。",
        en: "Recovery day — familiar moves only, give your body room.",
        ja: "回復日は馴染みの技だけ。",
      }),
    );
  } else {
    items.push(
      t(locale, {
        "zh-CN": `${ctx.beltLabel}、${ctx.goalLabel}，今天技术课按你现在的阶段来排。`,
        "zh-TW": `${ctx.beltLabel}、${ctx.goalLabel}，今天技術課按你現在的階段來排。`,
        en: `${ctx.beltLabel}, ${ctx.goalLabel} — today’s technique fits where you are right now.`,
        ja: `${ctx.beltLabel}・${ctx.goalLabel}、今の段階に合わせた技メニュー。`,
      }),
    );
  }

  if (ctx.tired) {
    items.push(
      t(locale, {
        "zh-CN": `今天有点累，体能只做 ${condSets} 组轻松的，滚技也别硬拼。`,
        "zh-TW": `今天有點累，體能只做 ${condSets} 組輕鬆的，滾技也別硬拼。`,
        en: `You’re tired today — only ${condSets} easy conditioning sets; save the ego for another day.`,
        ja: `疲れ気味なのでコンディション${condSets}セット、無理しない。`,
      }),
    );
  } else if (profile.goal === "competition") {
    items.push(
      t(locale, {
        "zh-CN": `你在备赛期，体能今天会多一点，${condSets} 组间歇，会有点喘。`,
        "zh-TW": `你在備賽期，體能今天會多一點，${condSets} 組間歇，會有點喘。`,
        en: `Comp prep — ${condSets} interval rounds today; expect to be breathing hard.`,
        ja: `試合前—インターバル${condSets}セット、キツめでOK。`,
      }),
    );
  } else if (profile.goal === "fat-loss") {
    items.push(
      t(locale, {
        "zh-CN": `减脂课心肺会顶一点，${condSets} 组，但能撑过去就对。`,
        "zh-TW": `減脂課心肺會頂一點，${condSets} 組，但能撐過去就對。`,
        en: `Fat-loss day — ${condSets} sets, cardio will push; that’s intentional.`,
        ja: `減量日—${condSets}セット、心肺を上げる。`,
      }),
    );
  } else {
    items.push(
      t(locale, {
        "zh-CN": `体能安排 ${condSets} 组，强度适中，配合你今天的状态。`,
        "zh-TW": `體能安排 ${condSets} 組，強度適中，配合你今天的狀態。`,
        en: `${condSets} conditioning sets — moderate load for how you’re showing up today.`,
        ja: `コンディション${condSets}セット、今日のコンディションに合わせて。`,
      }),
    );
  }

  if (ctx.senior) {
    items.push(
      t(locale, {
        "zh-CN": `35 岁后关节需要更久激活，热身给你留了 ${warmupMin} 分钟。`,
        "zh-TW": `35 歲後關節需要更久激活，熱身留了 ${warmupMin} 分鐘。`,
        en: `Past 35, joints need longer to wake up — ${warmupMin} minutes warm-up for you.`,
        ja: `35歳以降はウォームアップ${warmupMin}分しっかり。`,
      }),
    );
  } else if (ctx.tired) {
    items.push(
      t(locale, {
        "zh-CN": `今天有点累，热身 ${warmupMin} 分钟，不冲刺，把身体慢慢送进训练状态。`,
        "zh-TW": `今天有點累，熱身 ${warmupMin} 分鐘，不衝刺，把身體慢慢送進訓練狀態。`,
        en: `Tired day — ${warmupMin}-minute warm-up, no bursts, ease into training.`,
        ja: `疲れ気味—ウォームアップ${warmupMin}分、ゆっくり入る。`,
      }),
    );
  } else {
    items.push(
      t(locale, {
        "zh-CN": `热身 ${warmupMin} 分钟，够你把髋肩打开，再上垫不会硬。`,
        "zh-TW": `熱身 ${warmupMin} 分鐘，夠你把髖肩打開，再上墊不會硬。`,
        en: `${warmupMin} minutes warm-up — enough to open hips and shoulders before you roll.`,
        ja: `ウォームアップ${warmupMin}分でからだをほぐす。`,
      }),
    );
  }

  if (ctx.cycleMenstrual) {
    items.push(
      t(locale, {
        "zh-CN": "今天在月经期，主打恢复和轻练，别跟身体较劲。",
        "zh-TW": "今天在月經期，主打恢復和輕練，別跟身體較勁。",
        en: "Menstrual phase today — keep it light and recovery-focused.",
        ja: "月経期なので軽め・回復中心で。",
      }),
    );
  } else if (ctx.cycleLuteal) {
    items.push(
      t(locale, {
        "zh-CN": "黄体期容易乏一点，今天强度我会帮你收一收。",
        "zh-TW": "黃體期容易乏一點，今天強度我會幫你收一收。",
        en: "Luteal phase — energy can dip, so we’re easing intensity today.",
        ja: "黄体期は少し落ち着めに組む。",
      }),
    );
  } else if (profile.gender === "female" && profile.menstrualPhase === "排卵期") {
    items.push(
      t(locale, {
        "zh-CN": "排卵期状态通常不错，可以正常练，听身体就行。",
        "zh-TW": "排卵期狀態通常不錯，可以正常練，聽身體就行。",
        en: "Ovulatory phase — energy’s often solid; train normally and stay tuned in.",
        ja: "排卵期は調子が出やすい、普通に練習でOK。",
      }),
    );
  }

  if (ctx.energetic && profile.weeklyFrequency === "4plus") {
    items.push(
      t(locale, {
        "zh-CN": "这周练得勤，状态也好，技术课可以稍微挑战一点，但听身体，别硬顶。",
        "zh-TW": "這週練得勤，狀態也好，技術課可以稍微挑戰一點，但聽身體，別硬頂。",
        en: "Training often this week and you feel good — you can push technique a notch, still listen to your body.",
        ja: "週回数多く好調—少し攻めても、体調は見る。",
      }),
    );
  }

  return {
    title: t(locale, {
      "zh-CN": "教练怎么说",
      "zh-TW": "教練怎麼說",
      en: "Coach notes",
      ja: "コーチより",
    }),
    items: items.slice(0, 5),
  };
};

const buildOpening = (ctx: PlanContext) => {
  const minutes = computeSessionMinutes(ctx);
  const { locale } = ctx;

  const contextParts: string[] = [];
  if (ctx.feelingLabel) {
    contextParts.push(
      t(locale, {
        "zh-CN": `今天的「${ctx.feelingLabel}」感受`,
        "zh-TW": `今天的「${ctx.feelingLabel}」感受`,
        en: `feeling ${ctx.feelingLabel} today`,
        ja: `今日は「${ctx.feelingLabel}」`,
      }),
    );
  }
  if (ctx.menstrualPhaseLabel) {
    contextParts.push(
      t(locale, {
        "zh-CN": `目前处于${ctx.menstrualPhaseLabel}`,
        "zh-TW": `目前處於${ctx.menstrualPhaseLabel}`,
        en: `in your ${ctx.menstrualPhaseLabel}`,
        ja: `現在は${ctx.menstrualPhaseLabel}`,
      }),
    );
  }

  const feelingPhrase =
    contextParts.length > 0
      ? contextParts.join(
          t(locale, { "zh-CN": "、", "zh-TW": "、", en: ", ", ja: "、" }),
        )
      : t(locale, {
          "zh-CN": "今天的情况",
          "zh-TW": "今天的情況",
          en: "how you’re showing up today",
          ja: "今日のコンディション",
        });

  return t(locale, {
    "zh-CN": `根据你的${ctx.beltLabel}等级、${ctx.goalLabel}目标和${feelingPhrase}，这是为你定制的 ${minutes} 分钟训练方案。`,
    "zh-TW": `根據你的${ctx.beltLabel}等級、${ctx.goalLabel}目標和${feelingPhrase}，這是為你定制的 ${minutes} 分鐘訓練方案。`,
    en: `Based on your ${ctx.beltLabel}, ${ctx.goalLabel} focus, and ${feelingPhrase}, here’s your ${minutes}-minute session.`,
    ja: `${ctx.beltLabel}・${ctx.goalLabel}・${feelingPhrase}に合わせた、${minutes}分のプランです。`,
  });
};

const buildClosing = (locale: AppLocale) =>
  t(locale, {
    "zh-CN": "练完记得回来点「完成」，我会根据你的反馈调整下次方案。",
    "zh-TW": "練完記得回來點「完成」，我會根據你的回饋調整下次方案。",
    en: "When you’re done, tap “Complete” — I’ll tune the next plan from your feedback.",
    ja: "終わったら「完了」をタップしてね。次回はフィードバックを反映する。",
  });

export const estimatePlanSessionMinutes = (
  profile: UserProfile,
  difficultyOffset: PlanDifficultyOffset = 0,
): number => {
  const ctx = buildContext(profile, "zh-CN", clampOffset(difficultyOffset));
  return computeSessionMinutes(ctx);
};

export const generateTrainingPlan = (
  profile: UserProfile,
  locale: AppLocale,
  difficultyOffset: PlanDifficultyOffset = 0,
): TrainingPlanResult => {
  const offset = clampOffset(difficultyOffset);
  const ctx = buildContext(profile, locale, offset);

  const warmup = buildWarmupBlock(ctx);
  const technique = buildTechniqueBlock(ctx);
  const conditioning = buildConditioningBlock(ctx);
  const cooldown = buildCooldownBlock(ctx);
  const personalization = buildPersonalizationPanel(ctx);
  const opening = buildOpening(ctx);
  const closing = buildClosing(locale);

  const feelingSuffix = ctx.feelingLabel
    ? t(locale, {
        "zh-CN": `，今天${ctx.feelingLabel}`,
        "zh-TW": `，今天${ctx.feelingLabel}`,
        en: `, feeling ${ctx.feelingLabel} today`,
        ja: `、今日は${ctx.feelingLabel}`,
      })
    : "";

  return {
    headline: t(locale, {
      "zh-CN": "今日训练方案",
      "zh-TW": "今日訓練方案",
      en: "Today’s session",
      ja: "今日のメニュー",
    }),
    opening,
    closing,
    summary: t(locale, {
      "zh-CN": `${ctx.beltLabel} · ${ctx.goalLabel} · ${ctx.freqLabel}${feelingSuffix}`,
      "zh-TW": `${ctx.beltLabel} · ${ctx.goalLabel} · ${ctx.freqLabel}${feelingSuffix}`,
      en: `${ctx.beltLabel} · ${ctx.goalLabel} · ${ctx.freqLabel}${feelingSuffix}`,
      ja: `${ctx.beltLabel} · ${ctx.goalLabel} · ${ctx.freqLabel}${feelingSuffix}`,
    }),
    intensity: intensityLabel(ctx),
    intensityScore: ctx.finalScore,
    difficultyOffset: offset,
    personalization,
    warmup,
    technique,
    conditioning,
    cooldown,
  };
};