import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildGenerateSystemPrompt, buildGenerateUserPrompt } from "@/lib/prompts/generateListing";
import { completeChat, jsonModeForProvider } from "@/lib/llm/router";
import { extractJsonString } from "@/lib/llm/parseJson";
import { resolveDefaultProvider } from "@/lib/llm/models";
import { generateRequestSchema, listingOutputSchema } from "@/lib/validate/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const traceId = crypto.randomUUID();
  try {
    const body: unknown = await req.json();
    const input = generateRequestSchema.parse(body);
    const provider = input.provider ?? resolveDefaultProvider();
    const system = buildGenerateSystemPrompt(input.platform);
    const user = buildGenerateUserPrompt({
      platform: input.platform,
      keywords: input.keywords,
      competitorPaste: input.competitorPaste,
      asin: input.asin,
    });
    const jsonMode = jsonModeForProvider(provider);
    const raw = await completeChat({
      provider,
      model: input.model,
      temperature: input.temperature,
      jsonMode,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const jsonStr = extractJsonString(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { ok: false, traceId, error: "模型返回不是合法 JSON，请重试或更换 provider" },
        { status: 502 },
      );
    }
    const listing = listingOutputSchema.parse(parsed);
    return NextResponse.json({ ok: true, traceId, listing });
  } catch (e) {
    if (e instanceof ZodError) {
      const msg = e.errors.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ");
      return NextResponse.json({ ok: false, traceId, error: msg }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "未知错误";
    const status = /API|密钥|missing|403|429|5\d\d/.test(msg) ? 502 : 400;
    return NextResponse.json({ ok: false, traceId, error: msg }, { status });
  }
}
