import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useLocale } from "@/lib/locale";

type AtlasFeatureTabsProps = {
  progressDay?: number;
};

export const AtlasFeatureTabs = ({ progressDay = 1 }: AtlasFeatureTabsProps) => {
  const { pick } = useLocale();
  const tabItems = [
    {
      to: "/hundred-days?day=1",
      matchPath: "/hundred-days",
      label: `🗂️ ${pick({
        "zh-CN": "进度表",
        "zh-TW": "進度表",
        en: "Plan",
        ja: "進行表",
      })}`,
    },
    {
      to: "/profile?flow=ai-coach",
      matchPath: "/training-plan",
      label: `🤖 ${pick({
        "zh-CN": "AI教练方案",
        "zh-TW": "AI教練方案",
        en: "AI Coach",
        ja: "AIコーチ",
      })}`,
    },
    {
      to: "/atlas",
      matchPath: "/atlas",
      label: `🥋 ${pick({
        "zh-CN": "技巧库",
        "zh-TW": "技巧庫",
        en: "Moves",
        ja: "技一覧",
      })}`,
    },
    {
      to: "/training-log",
      matchPath: "/training-log",
      label: `📓 ${pick({
        "zh-CN": "训练日志",
        "zh-TW": "訓練日誌",
        en: "Diary",
        ja: "練習日誌",
      })}`,
    },
    {
      to: "/training-milestones",
      matchPath: "/training-milestones",
      label: `🏅 ${pick({
        "zh-CN": "训练里程碑",
        "zh-TW": "訓練里程碑",
        en: "Milestones",
        ja: "マイルストーン",
      })}`,
    },
  ];

  return (
    <div className="phantom-tab-stack">
      <nav
        className="atlas-subnav phantom-tab-nav"
        aria-label={pick({
          "zh-CN": "功能分页",
          "zh-TW": "功能分頁",
          en: "Feature navigation",
          ja: "機能ナビゲーション",
        })}
      >
        {tabItems.map((item) => {
          const to =
            item.matchPath === "/hundred-days" ? `/hundred-days?day=${progressDay}` : item.to;

          return (
            <NavLink
              key={item.matchPath}
              to={to}
              end={item.matchPath !== "/hundred-days"}
              className="atlas-subnav-link phantom-tab-link"
              activeClassName="atlas-subnav-link-active phantom-tab-link-active"
            >
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <p className="phantom-tab-nav-hint">
        {pick({
          "zh-CN": "标签较多时可左右滑动，第二个即为 AI 教练方案",
          "zh-TW": "標籤較多時可左右滑動，第二個即為 AI 教練方案",
          en: "Swipe the tabs sideways — AI Coach is the second tab.",
          ja: "タブは横スクロール。2番目がAIコーチです。",
        })}
      </p>

      <div className="phantom-tab-support">
        <Link to="/" className="atlas-subnav-link phantom-support-link">
          <span>
            🏠{" "}
            {pick({
              "zh-CN": "首页",
              "zh-TW": "首頁",
              en: "Home",
              ja: "ホーム",
            })}
          </span>
        </Link>
        <Link to="/drills" className="atlas-subnav-link phantom-support-link">
          <span>
            ♻️{" "}
            {pick({
              "zh-CN": "热身区",
              "zh-TW": "熱身區",
              en: "Warm-Up",
              ja: "ウォームアップ",
            })}
          </span>
        </Link>
        <Link to="/profile" className="atlas-subnav-link phantom-support-link">
          <span>
            👤{" "}
            {pick({
              "zh-CN": "个人资料",
              "zh-TW": "個人資料",
              en: "Profile",
              ja: "プロフィール",
            })}
          </span>
        </Link>
      </div>
    </div>
  );
};
