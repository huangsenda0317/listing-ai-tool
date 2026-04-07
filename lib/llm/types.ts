import type { Provider } from "@/lib/validate/schemas";

export type ChatMessage = { role: "system" | "user"; content: string };

export type LLMCompletionParams = {
  provider: Provider;
  model?: string;
  messages: ChatMessage[];
  temperature: number;
  /** OpenAI / 兼容端：尽量启用 JSON 模式 */
  jsonMode?: boolean;
};

export type ResolvedModel = { provider: Provider; model: string };
