import Anthropic from "@anthropic-ai/sdk";
import type { LLMCompletionParams } from "@/lib/llm/types";
import { defaultModelForProvider } from "@/lib/llm/models";

export async function completeAnthropic(params: LLMCompletionParams): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const client = new Anthropic({ apiKey });
  const model = params.model ?? defaultModelForProvider("anthropic");

  const system = params.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const userParts = params.messages.filter((m) => m.role === "user").map((m) => m.content);

  const userContent = userParts.join("\n\n");

  const res = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature: params.temperature,
    system: system || undefined,
    messages: [{ role: "user", content: userContent }],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("Claude 未返回文本");
  return block.text;
}
