import type { LLMCompletionParams } from "@/lib/llm/types";
import { assertProviderEnv } from "@/lib/llm/models";
import { completeOpenAI } from "@/lib/llm/openai";
import { completeAnthropic } from "@/lib/llm/anthropic";
import { completeQwen } from "@/lib/llm/qwen";
import { completeSpark } from "@/lib/llm/spark";

export async function completeChat(params: LLMCompletionParams): Promise<string> {
  assertProviderEnv(params.provider);
  switch (params.provider) {
    case "openai":
      return completeOpenAI(params);
    case "anthropic":
      return completeAnthropic({ ...params, jsonMode: false });
    case "qwen":
      return completeQwen(params);
    case "spark":
      return completeSpark(params);
    default: {
      const _n: never = params.provider;
      throw new Error(`不支持的 provider: ${_n}`);
    }
  }
}

/** Anthropic 无原生 json_schema 模式时仍请求严格 JSON（由 prompt 约束）。 */
export function jsonModeForProvider(provider: LLMCompletionParams["provider"]): boolean {
  return provider === "openai" || provider === "qwen" || provider === "spark";
}
