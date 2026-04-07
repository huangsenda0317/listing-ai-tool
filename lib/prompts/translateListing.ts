import type { Platform, TargetLocale } from "@/lib/validate/schemas";
import { summarizePlatformForPrompt } from "@/lib/prompts/platformRules";

const LOCALE_NAMES: Record<TargetLocale, string> = {
  es: "西班牙语 (es)",
  fr: "法语 (fr)",
  de: "德语 (de)",
  it: "意大利语 (it)",
  ja: "日语 (ja)",
  ko: "韩语 (ko)",
};

export const TRANSLATE_JSON_SCHEMA_HINT = `只输出一个 JSON 对象，键为语言代码，值是同结构的翻译结果对象：
{
  "es"?: { "title", "bullets", "backendKeywords", "longTail" },
  "fr"?: { ... },
  ...
}
每个 locale 的对象字段：
{
  "title": string,
  "bullets": string[], // 条数必须与英文一致
  "backendKeywords": string | string[],
  "longTail": string[] // 条数与英文一致或略少但不得为空数组
}
不要 markdown 围栏，不要额外文字。`;

export function buildTranslateSystemPrompt(platform: Platform, locales: TargetLocale[]): string {
  const ruleText = summarizePlatformForPrompt(platform);
  const localeLine = locales.map((l) => LOCALE_NAMES[l]).join("；");
  return [
    "你是电商本地化专家。将用户给出的英文 Listing 翻译成目标语言，用于指定平台。",
    "保持事实一致：不新增功效、认证、材质、尺寸；数字与单位保留；品牌名/型号保持原文或在目标语言中通行写法。",
    "根据平台规则再次控制标题长度与每条五点的长度，必要时压缩措辞但不丢失关键卖点。",
    `本次目标语言: ${localeLine}`,
    ruleText,
    TRANSLATE_JSON_SCHEMA_HINT,
  ].join("\n\n");
}

export function buildTranslateUserPrompt(input: {
  platform: Platform;
  locales: TargetLocale[];
  source: {
    title: string;
    bullets: string[];
    backendKeywords: string | string[];
    longTail: string[];
  };
}): string {
  const kw =
    typeof input.source.backendKeywords === "string"
      ? input.source.backendKeywords
      : input.source.backendKeywords.join(", ");
  return [
    `平台: ${input.platform}`,
    `需要输出的语言代码 keys: ${input.locales.join(", ")}`,
    "英文原文:",
    JSON.stringify(
      {
        title: input.source.title,
        bullets: input.source.bullets,
        backendKeywords: kw,
        longTail: input.source.longTail,
      },
      null,
      2,
    ),
  ].join("\n\n");
}
