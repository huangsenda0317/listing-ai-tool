import {
  localeSchema,
  translatedBlockSchema,
  translateRawSchema,
  type TargetLocale,
  type ListingOutput,
} from "@/lib/validate/schemas";

export type TranslatedBundle = Record<TargetLocale, ListingOutput>;

export function parseAndValidateTranslation(
  rawJson: unknown,
  expectedLocales: TargetLocale[],
  bulletCount: number,
): TranslatedBundle {
  const obj = translateRawSchema.parse(rawJson);
  const out = {} as TranslatedBundle;

  for (const loc of expectedLocales) {
    const v = obj[loc];
    if (v === undefined) {
      throw new Error(`缺少语言 ${loc} 的翻译结果`);
    }
    const block = translatedBlockSchema.parse(v);
    if (block.bullets.length !== bulletCount) {
      throw new Error(
        `${loc} 五点数量应为 ${bulletCount}，实际 ${block.bullets.length}`,
      );
    }
    const parsedLoc = localeSchema.safeParse(loc);
    if (!parsedLoc.success) throw new Error(`无效语言 key: ${loc}`);
    out[parsedLoc.data] = {
      title: block.title,
      bullets: block.bullets,
      backendKeywords: block.backendKeywords,
      longTail: block.longTail,
      notes: undefined,
    };
  }
  return out;
}
