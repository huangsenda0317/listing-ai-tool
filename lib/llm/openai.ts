import type { LLMCompletionParams } from "@/lib/llm/types";
import { defaultModelForProvider } from "@/lib/llm/models";
import { getOpenAI } from "@/lib/llm/openaiClient";

export async function completeOpenAI(params: LLMCompletionParams): Promise<string> {
  const client = getOpenAI();
  const model = params.model ?? defaultModelForProvider("openai");
  const messages = params.messages.map((m) => ({
    role: m.role as "system" | "user",
    content: m.content,
  }));

  const res = await client.chat.completions.create({
    model,
    temperature: params.temperature,
    messages,
    ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI 返回空内容");
  return text;
}
