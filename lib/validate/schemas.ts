import { z } from "zod";

export const platformSchema = z.enum(["amazon", "aliexpress", "shopee"]);

export const providerSchema = z.enum(["openai", "anthropic", "qwen", "spark"]);

export const localeSchema = z.enum(["es", "fr", "de", "it", "ja", "ko"]);

export const generateRequestSchema = z.object({
  platform: platformSchema,
  keywords: z.string().min(1, "请填写关键词"),
  competitorPaste: z.string().optional().default(""),
  asin: z.string().optional().default(""),
  provider: providerSchema.optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.4),
});

export const listingOutputSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).length(5),
  backendKeywords: z.union([z.string(), z.array(z.string())]),
  longTail: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

export type ListingOutput = z.infer<typeof listingOutputSchema>;
export type Platform = z.infer<typeof platformSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type TargetLocale = z.infer<typeof localeSchema>;

export const sourceEnPayloadSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()),
  backendKeywords: z.union([z.string(), z.array(z.string())]),
  longTail: z.array(z.string()),
});

export const translateRequestSchema = z.object({
  platform: platformSchema,
  sourceEn: sourceEnPayloadSchema,
  targetLocales: z.array(localeSchema).min(1),
  provider: providerSchema.optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.2),
});

export const translatedBlockSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()),
  backendKeywords: z.union([z.string(), z.array(z.string())]),
  longTail: z.array(z.string()).min(1),
});

export const translateRawSchema = z.record(z.string(), z.unknown());
