# Rebel BJJ — 我的柔术进化地图

> 专为 ADHD 女性设计的 BJJ 训练伴侣 | Solana 链上里程碑 · 游戏化打卡 · AI 个性化方案

基于训练者的个人资料与实时状态，生成有温度、可执行、可调整的专属方案。关键成就永久上链，不可篡改。

[![Vercel](https://img.shields.io/badge/线上地址-phantom--thief--s--mat--main.vercel.app-000?logo=vercel)](https://phantom-thief-s-mat-main.vercel.app)
[![GitHub](https://img.shields.io/badge/开源仓库-rebelbjj-181717?logo=github)](https://github.com/kathyyxu/rebelbjj)
[![Demo](https://img.shields.io/badge/Demo%20Video-YouTube-red?logo=youtube)](https://www.youtube.com/watch?v=hhNkXFIhmZ8)

---

## 🎯 一句话定位

**一个会夸人的 AI 柔术教练 + 链上成绩单 + 游戏化成长地图**

---

## ✨ 核心功能

### 📝 训练日志 · 生理周期追踪
记录每次训练的日期、时长、技术动作，并追踪生理周期阶段（经期/卵泡期/排卵期/黄体期）。**让训练计划与身体节律匹配，不再硬扛。**

### 🎡 幸运转盘 · ADHD 友好
随机抽取训练动作，**解决 ADHD 用户对重复性训练的抗拒**。每次打开都是惊喜，把枯燥变成游戏。

### 🏆 游戏化激励 · 链上连胜
连续打卡、累计训练次数、首次比赛、首次获胜……**里程碑自动记录，关键成就上链存证**。不可篡改，永远属于你。

### 🧠 AI 教练 · 个性化方案 + 夸夸
基于年龄、腰带、目标、当日感受，生成专属训练方案（热身→技术→体能→复盘）。点击「太难/太简单」动态调整强度。**每次还附赠 3 个 AI 夸夸，从你的数据里发现光。**

**使用流程**：首页进入「AI 教练方案」→ 先填写并保存个人资料 → 点击「生成专属训练方案」后才会调用 API 生成。

### 🔐 钱包登录 · 链上认证
支持 OKX Wallet / Phantom Wallet 一键登录。升带需教练钱包签名上链，**形成不可磨灭的柔术履历**。

---

## ⚙️ 技术实现

### AI 引擎：规则骨架 + LLM 润色

| 层级 | 作用 |
|---|---|
| **规则引擎** | 保证训练结构永远正确可用（动作、组数、时长） |
| **LLM 润色层** | 调用 Gemini 2.5 Flash，将规则输出翻译成亲切、鼓励的教练话术 |
| **混合架构 + 兜底** | LLM 失败时自动降级到纯规则版，永不空手而归 |

### Web3 原生

- **钱包登录**：OKX / Phantom 钱包一键登录
- **链上里程碑**：比赛成绩、升带等关键成就通过教练签名上链（Solana Devnet）
- **用户数据主权**：训练记录本地存储 + 可选链上备份

---

## 🛠️ 技术栈

| 领域 | 技术 |
|---|---|
| **前端** | React 18 + Vite + TypeScript |
| **区块链** | Solana Web3 + Phantom / OKX 钱包 |
| **AI 引擎** | 规则引擎（决策树）+ Gemini 2.5 Flash（话术润色） |
| **数据持久化** | LocalStorage + Solana Devnet（关键成就） |
| **部署** | Vercel |

---

## 🚀 本地运行

```bash
git clone https://github.com/kathyyxu/rebelbjj.git
cd rebelbjj
npm install
npm run dev
# 访问 http://localhost:8080
```

本地 `npm run dev` 仅提供前端；LLM 润色需部署到 Vercel 或使用 `npx vercel dev`。


## 📦 生产部署

**生产环境**：[https://phantom-thief-s-mat-main.vercel.app](https://phantom-thief-s-mat-main.vercel.app)

推送 `main` 分支到 GitHub 会自动触发 Vercel 部署。
```bash
npx vercel link --project phantom-thief-s-mat-main --yes
npx vercel deploy --prod --yes
```

### Vercel 环境变量（AI 教练）

| Variable | Purpose |
|----------|---------|
| `TRAINING_PLAN_LLM_PROVIDER` | `gemini`（默认）、`openai`、`groq`、`openrouter`、`xai` |
| `TRAINING_PLAN_LLM_API_KEY` | 可选统一 Key |
| `GEMINI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI |
| `GROQ_API_KEY` | Groq |
| `OPENROUTER_API_KEY` | OpenRouter |
| `XAI_API_KEY` | xAI Grok |

可选模型：`GEMINI_MODEL`、`OPENAI_MODEL`、`GROQ_MODEL`、`OPENROUTER_MODEL`、`XAI_MODEL`。

API：`POST /api/training/generate-plan`（见 `api/training/generate-plan.ts`）。

---

## 项目结构

- `src/` — React 前端
- `api/`、`rust-api/` — Vercel 服务端（含训练方案 LLM 接口）
- `anchor/` — Solana / Anchor 程序
- `backend/` — 链下辅助逻辑

Built for **Build with XAgent x OKX**。
