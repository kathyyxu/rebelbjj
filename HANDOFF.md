# Rebel BJJ Handoff

Use this file to continue the project from a new Codex, Cursor, or ChatGPT session.

**Last updated:** 2026-06-03 · branch `main` · latest notable commit: `76caecd` (README)

## Project Links

- **GitHub:** https://github.com/kathyyxu/rebelbjj
- **Live app (production only):** https://phantom-thief-s-mat-main.vercel.app/
- **Demo video:** https://www.youtube.com/watch?v=hhNkXFIhmZ8&t=63s
- **Hackathon PR:** https://github.com/xerpa-ai/xagt-plugin/pull/7
- **Participant ID:** `2055715141135110144`

## One-Liner

Rebel BJJ（我的柔术进化地图）— 面向 ADHD 女性的 BJJ 训练伴侣：AI 教练方案、训练日志、生理周期、游戏化打卡、链上里程碑，OKX / Phantom / 邮箱登录。

---

## Current State (2026-06-03)

### Product / UX

| 模块 | 状态 |
|------|------|
| 首页入口 | 六大功能：100 天进度表、AI 教练、训练日志、训练里程碑、热身转盘、技巧库 |
| **AI 教练训练方案** | 规则引擎生成结构 + 可选 LLM 润色；页头不显示 API 失败文案 |
| **资料页流程** | 首页/导航「AI 教练」→ `/profile?flow=ai-coach`；**保存资料** 与 **生成专属训练方案** 分离；仅后者触发 API |
| **夸夸 3 优点** | 方案底部独立区块；LLM 成功用 AI 文案，失败用规则引擎兜底（`trainingPlanPraise.ts`） |
| 训练日志 | 含生理周期；scoped LocalStorage |
| 里程碑 / 教练认证 | Solana Devnet；Phantom 签证明；教练验证 API（Rust） |
| 多语言 | zh-CN / zh-TW / en / ja |

### AI 教练技术栈（混合）

1. **规则引擎** — `src/lib/trainingPlanEngine.ts`：段落、动作、时长、强度（永远可用）
2. **LLM 层** — `api/training/generate-plan.ts`（Vercel Node）：Gemini 2.5 Flash 默认，润色 opening/closing/夸夸/备注等
3. **客户端** — `src/lib/trainingPlanLlm.ts`：请求 API，失败则规则版；`generatePlan` 仅在有 `location.state.generatePlan` 或重新生成/调难度时调 API
4. **入口** — `src/pages/TrainingPlan.tsx`、`src/pages/Profile.tsx`

### 部署与密钥

- Vercel 项目名：**`phantom-thief-s-mat-main`**（不要用 `rebelbjj` 别名）
- 环境变量：`GEMINI_API_KEY`、`TRAINING_PLAN_LLM_PROVIDER`（默认 `gemini`）、可选 `GEMINI_MODEL=gemini-2.5-flash`
- **已知问题：** Gemini 免费额度易 429；夸夸与规则兜底仍可显示，LLM 润色可能间歇失败

### 仓库与文档

- `README.md` — 中文产品说明（已修 Markdown 格式、补全功能亮点）
- `HANDOFF.md` — 本文件
- `vercel.json` — SPA + `api/training/generate-plan` maxDuration 30s

### 仍沿用（未大改）

- OKX 登录：`window.okxwallet.solana.connect()`
- 里程碑链上证明：仍用 **Phantom** 签名（非 OKX）
- Anchor / backend / rust-api 演示代码仍在仓库

---

## Key Files (AI 教练)

| 路径 | 作用 |
|------|------|
| `src/pages/Profile.tsx` | 资料表单；`flow=ai-coach` 时双按钮 |
| `src/pages/TrainingPlan.tsx` | 方案 UI、历史、完成记入日志 |
| `src/lib/trainingPlanEngine.ts` | 规则生成 |
| `src/lib/trainingPlanLlm.ts` | API 调用与合并 |
| `src/lib/trainingPlanPraise.ts` | 规则版夸夸 |
| `api/training/generate-plan.ts` | 服务端 LLM |
| `src/components/AtlasFeatureTabs.tsx` | 导航 AI 教练 → 资料页 |

---

## Important Behavior

- **本地开发：** `npm run dev` → **http://localhost:8080**（不是 5173）
- **LLM 本地：** 仅前端时不会调通 API；用 `npx vercel dev` 或测生产环境
- **Codex 内置浏览器：** 无 OKX 扩展；钱包登录请用 Chrome + 扩展，或邮箱登录
- **用户数据：** 训练记录/方案在浏览器 LocalStorage（按登录 scope），不在 repo 里
- **Documents 副本：** `~/Documents/Codex/.../phantom-thief-s-mat-main` 可能过时；以 **`~/rebelbjj` + GitHub** 为准

---

## Local Commands

```bash
cd rebelbjj   # 或 clone 后的目录
npm install
npm run dev     # http://localhost:8080
npm run build
npm run test
```

## Deployment

```bash
npx vercel link --project phantom-thief-s-mat-main --yes
npx vercel deploy --prod --yes
```

生产 URL：https://phantom-thief-s-mat-main.vercel.app/

---

## Resume Checklist (换项目后再回来)

1. **Open Folder** → `/Users/kathy/rebelbjj`（不要只开 `~/` 根目录）
2. `git pull origin main`
3. 读 `README.md` + 本 `HANDOFF.md`
4. 对新 AI 说：「请读 HANDOFF.md，从 main 继续 Rebel BJJ」
5. `npm install`（如依赖变了）→ `npm run dev`
6. 测 AI 教练：登录 → 资料页 → 保存 → **生成专属训练方案**

---

## 2026-06-03 会话备忘

- 实现混合 LLM + 规则兜底；夸夸区块；资料页双按钮；取消页头「API 未启用」提示
- README 修格式、补 100 天/Atlas/里程碑/邮箱/多语言说明
- macOS 下载副本若打不开文件：`xattr -dr com.apple.quarantine <项目路径>`

---

## Suggested Next Work

- Gemini 配额 / 换 Key 或备用 provider（Groq、OpenRouter）保证 LLM 润色稳定
- 钱包面板内补充 OKX vs Phantom 分工说明（登录 vs 链上证明）
- 是否让 Devnet 证明也支持 OKX 签名
- README 配图 / GIF；HANDOFF 与 README 同步策略（只改 `rebelbjj/README.md` 再 push）
- 清理未使用的 npm 依赖（如 okx universal-provider 若已不用）