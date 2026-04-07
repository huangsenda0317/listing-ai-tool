import type { Platform } from "@/lib/validate/schemas";

export type PlatformRuleSet = {
  id: Platform;
  label: string;
  titleMax: number;
  bulletCount: number;
  bulletMaxChars: number;
  hints: string[];
};

/** 规则为运营向「常见限制」近似值，写入 prompt；非平台保证。 */
export const PLATFORM_RULES: Record<Platform, PlatformRuleSet> = {
  amazon: {
    id: "amazon",
    label: "Amazon",
    titleMax: 200,
    bulletCount: 5,
    bulletMaxChars: 500,
    hints: [
      "标题约 200 字节内（UTF-8 计字节更严），避免全大写与夸张承诺词（如 cure、guarantee cure）。",
      "五点每条建议约 100–500 字符区间，首词可适度用大写突出；不要 HTML。",
      "后台 Search Terms 有别于标题，避免与标题完全重复堆砌。",
    ],
  },
  aliexpress: {
    id: "aliexpress",
    label: "AliExpress / 速卖通",
    titleMax: 128,
    bulletCount: 5,
    bulletMaxChars: 600,
    hints: [
      "标题常见上限约 128 字符，可含核心词与卖点，避免过多特殊符号。",
      "五点用于移动端要点展示，句子清晰、适度 emoji 可按品类谨慎使用（默认不用）。",
      "关键词与长尾可略长，便于站内搜索覆盖。",
    ],
  },
  shopee: {
    id: "shopee",
    label: "Shopee",
    titleMax: 120,
    bulletCount: 5,
    bulletMaxChars: 500,
    hints: [
      "标题常见上限约 120 字符，避免违规词与引流站外内容。",
      "五点偏短句、强利益点；类目词靠前。",
      "关键词注意各站点（如 TW/SG/BR）本地用词，此处英文站点稿可再本地化。",
    ],
  },
};

export function summarizePlatformForPrompt(platform: Platform): string {
  const r = PLATFORM_RULES[platform];
  const hintBlock = r.hints.map((h) => `- ${h}`).join("\n");
  return [
    `平台: ${r.label}`,
    `标题长度建议: ≤ ${r.titleMax} 字符（按平台常见规则近似，生成时尽量遵守）。`,
    `五点数量: 必须恰好 ${r.bulletCount} 条；每条建议 ≤ ${r.bulletMaxChars} 字符。`,
    "要点说明:",
    hintBlock,
  ].join("\n");
}
