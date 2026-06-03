# Rebel BJJ — 我的柔术进化地图

> 专为 ADHD 女性设计的 BJJ 训练伴侣 | Solana 链上里程碑 · 游戏化打卡 · AI 个性化方案

基于训练者的个人资料和实时状态，生成有温度、可执行、可调整的专属方案。关键成就永久上链，不可篡改。

[![Vercel](https://img.shields.io/badge/线上地址-phantom--thief--s--mat--main.vercel.app-000?logo=vercel)](https://phantom-thief-s-mat-main.vercel.app)
[![GitHub](https://img.shields.io/badge/开源仓库-rebelbjj-181717?logo=github)](https://github.com/kathyyxu/rebelbjj)
[![Demo](https://img.shields.io/badge/Demo%20Video-YouTube-red?logo=youtube)](https://www.youtube.com/watch?v=hhNkXFIhmZ8)

---

## 🎯 一句话定位

**一个会夸人的 AI 柔术教练 + 链上成绩单。**

---

## 🧠 核心 AI 能力：智能方案 + 个性化鼓励

Rebel BJJ 的 AI 教练不只是生成冷冰冰的训练计划。它基于你的数据，为你提供 **有温度、可执行、可调整** 的专属方案。

### ✨ 三大亮点

#### 1. 个性化生成
基于年龄、腰带级别、训练目标（备赛/日常/减脂/恢复）及当日感受，自动生成完整方案：热身 → 技术 → 体能 → 复盘。

#### 2. 难度动态调节
点击「太难了」或「太简单了」，AI 立即调整体能强度与技术复杂度，让方案始终匹配你当天的状态。

#### 3. 🤗 AI 夸夸 3 个优点
每次生成方案后，AI 会根据你的训练数据，写出 3 个具体、真诚的优点。例如：

> “本周已训练 3 次，坚持力很强”  
> “白带阶段就认真记录，态度决定高度”  
> “今天感觉疲惫还点开方案，已经战胜了昨天的自己”

我们不熬鸡汤，只从你的数据里发现光。

### ⚙️ 技术实现

| 层级 | 作用 |
|---|---|
| **规则引擎** | 保证训练结构永远正确可用（动作、组数、时长） |
| **LLM 润色层** | 调用 Gemini 2.5 Flash，将规则输出翻译成亲切、鼓励的教练话术 |
| **混合架构 + 兜底** | LLM 失败时自动降级到纯规则版，永不空手而归 |

**使用流程**：首页进入「AI 教练方案」→ 先填写并保存个人资料 → 点击「生成专属训练方案」后才会调用 API 生成。

---

## 🔐 Web3 原生：钱包登录与链上认证

Rebel BJJ 是一个 **Web3 原生** 的 AI 训练伴侣，支持通过 **OKX Wallet** 或 **Phantom Wallet** 登录，并将关键成就永久存储在 Solana 区块链上。

| 功能 | 说明 |
|---|---|
| **钱包邮箱均可登录** | 使用 OKX 或 Phantom 钱包一键登录，也可以使用邮箱登录 |
| **链上里程碑** | 首次比赛、首次获胜、升带等成就通过教练钱包签名后上链，不可篡改、永久可查 |
| **教练认证** | 教练需使用钱包签名确认学员升带，确保认证真实可信 |
| **用户数据主权** | 训练记录本地存储 + 可选链上备份，用户完全掌控自己的数据 |

> 你的训练方案由 AI 生成（本地规则 + API 润色），但你的成长轨迹写入区块链。这是 **属于你自己的、不可磨灭的柔术履历**。

---

## 📋 其他核心功能

- **训练日志**：记录日期、时长、技术动作、生理周期阶段（经期/卵泡期/黄体期等）
- **幸运转盘**：随机抽取训练动作，解决 ADHD 用户对重复性训练的抗拒
- **游戏化激励**：连续打卡、累计训练次数等成就系统
- **多语言支持**：简体中文、繁体中文、英文、日文

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

## 生产部署

始终部署到 Vercel 项目 **`phantom-thief-s-mat-main`**（不要用单独的 `rebelbjj` 别名）。

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