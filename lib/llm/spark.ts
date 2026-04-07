import OpenAI from "openai";
import type { LLMCompletionParams } from "@/lib/llm/types";
import { defaultModelForProvider } from "@/lib/llm/models";

/** 讯飞星火 OpenAI 兼容 HTTP（请以控制台文档为准配置 SPARK_API_KEY） */
export async function completeSpark(params: LLMCompletionParams): Promise<string> {
  const apiKey = process.env.SPARK_API_KEY;
  if (!apiKey) throw new Error("SPARK_API_KEY missing");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://spark-api-open.xf-yun.com/v1",
  });

  const model = params.model ?? defaultModelForProvider("spark");
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
  if (!text) throw new Error("讯飞星火返回空内容");
  return text;
}
