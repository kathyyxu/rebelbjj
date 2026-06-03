import { AppLocale, pickLocaleValue } from "@/lib/locale";
import type { TrainingPlanResult } from "@/lib/trainingPlanEngine";
import { TrainingPlanCoachContext } from "@/lib/trainingPlanLlm";
import {
  BeltLevel,
  RecentFeeling,
  TrainingGoal,
  UserProfile,
} from "@/lib/userProfile";

type LocaleVariants<T> = Partial<Record<AppLocale, T>> & { "zh-CN": T };

const t = <T,>(locale: AppLocale, variants: LocaleVariants<T>) =>
  pickLocaleValue(locale, variants);

const beltPraise = (belt: BeltLevel, locale: AppLocale) =>
  ({
    white: t(locale, {
      "zh-CN": "白带阶段就主动要方案，学习态度已经超过很多人",
      "zh-TW": "白帶階段就主動要方案，學習態度已經超過很多人",
      en: "As a white belt you’re already showing up with a planner’s mindset",
      ja: "白帯なのに自分からプランを引き出す姿勢がすごい",
    }),
    blue: t(locale, {
      "zh-CN": "蓝带还在打磨细节，这种耐心会转化成比赛里的稳定",
      "zh-TW": "藍帶還在打磨細節，這種耐心會轉化成比賽裡的穩定",
      en: "Blue belt grind on details — that patience shows up in competition",
      ja: "青帯の丁寧な積み上げは試合で効いてくる",
    }),
    purple: t(locale, {
      "zh-CN": "紫带还在系统化训练，说明你在用脑子打柔术",
      "zh-TW": "紫帶還在系統化訓練，說明你在用腦子打柔術",
      en: "Purple belt and still structuring sessions — you’re thinking the game",
      ja: "紫帯でメニューを組むのは頭で打ててる証拠",
    }),
    brown: t(locale, {
      "zh-CN": "棕带仍愿意微调强度，成熟选手才会这样照顾自己",
      "zh-TW": "棕帶仍願意微調強度，成熟選手才會這樣照顧自己",
      en: "Brown belt who still tunes intensity — that’s mature self-coaching",
      ja: "茶帯が強度を調整できるのは本当の選手の習慣",
    }),
    black: t(locale, {
      "zh-CN": "黑带还认真做每日方案，领袖气质就是在细节上坚持",
      "zh-TW": "黑帶還認真做每日方案，領袖氣質就是在細節上堅持",
      en: "Black belt still running daily plans — leadership is in the details",
      ja: "黒帯が毎日プランを組むのは指導者の姿勢",
    }),
  })[belt];

const goalPraise = (goal: TrainingGoal, locale: AppLocale) =>
  ({
    competition: t(locale, {
      "zh-CN": "目标清晰在备赛，今天这一步也是在为擂台蓄力",
      "zh-TW": "目標清晰在備賽，今天這一步也是在為擂台蓄力",
      en: "Competition-focused — today’s session is another brick for the podium",
      ja: "試合に向けた目標がはっきりしていて今日も一歩前進",
    }),
    improvement: t(locale, {
      "zh-CN": "把「日常精进」当目标的人，进步曲线会更陡",
      "zh-TW": "把「日常精進」當目標的人，進步曲線會更陡",
      en: "Daily improvement as a goal — your curve stays steep",
      ja: "日々の上達を掲げているから伸びしろが大きい",
    }),
    "fat-loss": t(locale, {
      "zh-CN": "减脂和柔术一起抓，说明你在为长期健康投资",
      "zh-TW": "減脂和柔術一起抓，說明你在為長期健康投資",
      en: "Chasing fat loss and BJJ together — long-term health bet",
      ja: "減量と柔術を両立させるのは長期の体への投資",
    }),
    recovery: t(locale, {
      "zh-CN": "知道什么时候该恢复，这比盲目加练更专业",
      "zh-TW": "知道什麼時候該恢復，這比盲目加練更專業",
      en: "Choosing recovery over blind volume — that’s pro judgment",
      ja: "回復を選べるのはプロの判断",
    }),
    health: t(locale, {
      "zh-CN": "把健康放在优先级，训练才能打很多年",
      "zh-TW": "把健康放在優先級，訓練才能打很多年",
      en: "Health-first training — you’re building a long mat career",
      ja: "健康優先の練習は長く続けられる",
    }),
  })[goal];

const feelingPraise = (feeling: RecentFeeling, locale: AppLocale) =>
  ({
    energetic: t(locale, {
      "zh-CN": "今天状态在线，好能量要用来打磨技术而不是乱耗",
      "zh-TW": "今天狀態在線，好能量要用來打磨技術而不是亂耗",
      en: "Energy’s up today — channel it into sharp reps",
      ja: "好調の日はエネルギーを技に落とし込める",
    }),
    normal: t(locale, {
      "zh-CN": "状态平稳还来训练，这种节奏最容易积累优势",
      "zh-TW": "狀態平穩還來訓練，這種節奏最容易積累優勢",
      en: "Steady day, still on the mat — consistency wins",
      ja: "普通の日でも来るのが一番伸びる",
    }),
    tired: t(locale, {
      "zh-CN": "疲惫还点开方案，已经战胜了想躺平的自己",
      "zh-TW": "疲憊還點開方案，已經戰勝了想躺平的自己",
      en: "Tired but still opening the plan — you beat the couch",
      ja: "疲れてるのにプランを開くのは勝ち",
    }),
  })[feeling];

export const buildTrainingPlanPraise = (
  profile: UserProfile,
  locale: AppLocale,
  context: TrainingPlanCoachContext,
): string => {
  const bullets: string[] = [];

  if (context.sessionsThisWeek > 0) {
    bullets.push(
      t(locale, {
        "zh-CN": `本周已训练 ${context.sessionsThisWeek} 次，坚持力很强`,
        "zh-TW": `本週已訓練 ${context.sessionsThisWeek} 次，堅持力很強`,
        en: `${context.sessionsThisWeek} session(s) this week — strong consistency`,
        ja: `今週${context.sessionsThisWeek}回練習、継続力が光る`,
      }),
    );
  }

  if (context.totalLoggedSessions > 0 && bullets.length < 3) {
    bullets.push(
      t(locale, {
        "zh-CN": `已累计 ${context.totalLoggedSessions} 条训练记录，你在认真经营自己的柔术档案`,
        "zh-TW": `已累計 ${context.totalLoggedSessions} 條訓練記錄，你在認真經營自己的柔術檔案`,
        en: `${context.totalLoggedSessions} logs on file — you’re building a real BJJ archive`,
        ja: `記録${context.totalLoggedSessions}件、自分の柔術データをちゃんと残している`,
      }),
    );
  }

  if (context.completedPlanSessions > 0 && bullets.length < 3) {
    bullets.push(
      t(locale, {
        "zh-CN": `已完成 ${context.completedPlanSessions} 次教练方案，说到做到`,
        "zh-TW": `已完成 ${context.completedPlanSessions} 次教練方案，說到做到`,
        en: `${context.completedPlanSessions} coach plan(s) finished — you follow through`,
        ja: `コーチプラン${context.completedPlanSessions}回完了、言ったことをやっている`,
      }),
    );
  }

  if (profile.recentFeeling && bullets.length < 3) {
    bullets.push(feelingPraise(profile.recentFeeling, locale));
  }

  if (bullets.length < 3) {
    bullets.push(beltPraise(profile.belt, locale));
  }
  if (bullets.length < 3) {
    bullets.push(goalPraise(profile.goal, locale));
  }

  const fallbacks = [
    t(locale, {
      "zh-CN": "愿意按方案练，比凭感觉乱滚更专业",
      "zh-TW": "願意按方案練，比憑感覺亂滾更專業",
      en: "Training with a plan beats random rounds",
      ja: "プラン通りに練ぶのは感覺だけよりプロ",
    }),
    t(locale, {
      "zh-CN": "每次点开方案，都是在给未来的自己存筹码",
      "zh-TW": "每次點開方案，都是在給未來的自己存籌碼",
      en: "Every time you open the plan, you bank credit for future you",
      ja: "プランを開くたび未来の自分に投資している",
    }),
    t(locale, {
      "zh-CN": "能照顾强度又愿意练，身体会越来越听你的话",
      "zh-TW": "能照顧強度又願意練，身體會越來越聽你的話",
      en: "You balance load and effort — your body will trust you more",
      ja: "強度を整えつつ練習できるのは体との信頼の証",
    }),
  ];

  for (const line of fallbacks) {
    if (bullets.length >= 3) break;
    if (!bullets.includes(line)) bullets.push(line);
  }

  const title = t(locale, {
    "zh-CN": "✨ 今天夸夸你的三个优点：",
    "zh-TW": "✨ 今天夸夸你的三個優點：",
    en: "✨ Three things I’m proud of you for today:",
    ja: "✨ 今日のあなたの良いところ三つ：",
  });

  return `${title}\n1. ${bullets[0]}\n2. ${bullets[1]}\n3. ${bullets[2]}`;
};

export const ensurePlanHasPraise = (
  plan: TrainingPlanResult,
  profile: UserProfile,
  locale: AppLocale,
  context: TrainingPlanCoachContext,
): TrainingPlanResult =>
  plan.praise?.trim()
    ? plan
    : { ...plan, praise: buildTrainingPlanPraise(profile, locale, context) };