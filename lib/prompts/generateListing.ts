import type { Platform } from "@/lib/validate/schemas";
import { summarizePlatformForPrompt } from "@/lib/prompts/platformRules";

export const LISTING_JSON_SCHEMA_HINT = `你必须只输出一个 JSON 对象（不要 markdown 代码块、不要前后说明文字），字段如下：
{
  "title": string,
  "bullets": string[],  // 长度必须等于平台要求的条数
  "backendKeywords": string | string[], // 后台搜索词，可为逗号分隔一句或数组
  "longTail": string[], // 10–20 条长尾词或词组
  "notes": string // 可选：SEO 或合规注意点（简短）
}`;

export function buildGenerateSystemPrompt(platform: Platform): string {
  const ruleText = summarizePlatformForPrompt(platform);
  return [
    "你是资深跨境电商 Listing 文案与 SEO 专家，熟悉亚马逊、速卖通、Shopee 的常见规范。",
    "根据用户给的关键词与竞品参考正文，输出适合指定平台的英文 Listing（美国/全球通用英文稿）。",
    "不要捏造认证、专利、医疗功效；不做价格/促销承诺。",
    "若竞品文本与关键词冲突，以关键词与合规为准，可借鉴竞品结构而非照搬。",
    ruleText,
    LISTING_JSON_SCHEMA_HINT,
  ].join("\n\n");
}

export function buildGenerateUserPrompt(input: {
  platform: Platform;
  keywords: string;
  competitorPaste: string;
  asin: string;
}): string {
  const parts: string[] = [
    `平台: ${input.platform}`,
    `核心关键词/词根（可多条，换行或逗号分隔）:\n${input.keywords.trim()}`,
  ];
  if (input.asin.trim()) {
    parts.push(`备注 ASIN（仅归档，不表示已抓取页面）: ${input.asin.trim()}`);
  }
  if (input.competitorPaste.trim()) {
    parts.push(`竞品参考文案（标题/五点/描述粘贴）:\n${input.competitorPaste.trim()}`);
  } else {
    parts.push("竞品参考文案: （无，请根据关键词与常识推断品类与卖点）");
  }
  return parts.join("\n\n");
}
