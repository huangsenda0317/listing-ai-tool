import OpenAI from "openai";
import type { LLMCompletionParams } from "@/lib/llm/types";
import { defaultModelForProvider } from "@/lib/llm/models";

/** 通义千问 DashScope OpenAI 兼容模式 */
export async function completeQwen(params: LLMCompletionParams): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY missing");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  const model = params.model ?? defaultModelForProvider("qwen");
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
  if (!text) throw new Error("通义千问返回空内容");
  return text;
}
