# Listing AI Tool

内部用跨境电商 Listing 生成 / 优化 / 多语言翻译工作台（Next.js App Router）。关键词与竞品文案由运营手动粘贴；API Key 仅保存在服务端环境变量中。

## 快速开始

```bash
cp .env.example .env.local
# 编辑 .env.local，至少填写一个 LLM 的密钥

npm install
npm run dev
```

浏览器打开 <http://localhost:3000>。

## 环境变量

见 [.env.example](./.env.example)。各厂商控制台：

- OpenAI / GPT-4o
- Anthropic / Claude 3.x
- 阿里云 DashScope / 通义（兼容 OpenAI 的 base URL 已在代码中配置）
- 讯飞星火（OpenAI 兼容端点：`https://spark-api-open.xf-yun.com/v1`，密钥以控制台文档为准）

## 功能

- 按 **亚马逊 / 速卖通 / Shopee** 规则生成英文标题、五点、后台关键词、长尾词（规则写入 prompt，非官方 API）。
- **英 → 西 / 法 / 德 / 意 / 日 / 韩** 批量翻译。
- **导出 Excel**、字段级 **复制**，便于回填后台。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发（Node，热更新） |
| `npm run build` | 仅 `next build` |
| `npm run cf-build` | OpenNext 完整构建（生成 `.open-next/`，用于 Workers） |
| `npm run preview` | 构建后在本地 **workerd** 预览（接近线上） |
| `npm run deploy` | 构建并部署到 Cloudflare Workers |
| `npm run start` | Node 下 `next start`（非 Cloudflare 运行时） |
| `npm run lint` | ESLint |

## 部署到 Cloudflare（OpenNext）

本项目使用 [@opennextjs/cloudflare](https://opennextjs.org/cloudflare)，在 Workers 上运行 **Node.js 兼容运行时**（`nodejs_compat`），**请勿**再使用已弃用的 `npx @cloudflare/next-on-pages@1`。

1. 根目录已有 [`wrangler.jsonc`](./wrangler.jsonc)、[`open-next.config.ts`](./open-next.config.ts)。
2. **Workers Builds / CI**：构建命令建议使用 `npm run cf-build`（或 `npx opennextjs-cloudflare build`），并按 [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) 与 [OpenNext 环境变量说明](https://opennext.js.org/cloudflare/howtos/env-vars) 在控制台配置 `OPENAI_API_KEY` 等与 `.env.example` 对应的变量。
3. 本地预览 Workers 行为：`cp .dev.vars.example .dev.vars` 后执行 `npm run preview`。
4. 可选：在 `open-next.config.ts` 中启用 R2 增量缓存，见 [Caching](https://opennext.js.org/cloudflare/caching)（迁移时若未开通 R2 需手动配置）。
5. 若需 **next/image** 走 Cloudflare Images，再在 `wrangler.jsonc` 中按 [官方文档](https://opennext.js.org/cloudflare/howtos/image) 增加 `images` 绑定。

## 技术说明

- 生成与翻译均通过 `app/api/*` 调用大模型，前端不暴露密钥。
- 输出要求为 JSON；服务端用 Zod 校验，解析失败时会返回错误信息。
