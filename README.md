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

| 命令         | 说明     |
| ------------ | -------- |
| `npm run dev`    | 本地开发 |
| `npm run build`  | 生产构建 |
| `npm run start`  | 启动生产 |
| `npm run lint`   | ESLint   |

## 技术说明

- 生成与翻译均通过 `app/api/*` 调用大模型，前端不暴露密钥。
- 输出要求为 JSON；服务端用 Zod 校验，解析失败时会返回错误信息。
