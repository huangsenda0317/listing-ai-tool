import type { Provider } from "@/lib/validate/schemas";

export function defaultModelForProvider(p: Provider): string {
  switch (p) {
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4o";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
    case "qwen":
      return process.env.QWEN_MODEL ?? "qwen-plus";
    case "spark":
      return process.env.SPARK_MODEL ?? "generalv3.5";
    default: {
      const _x: never = p;
      return _x;
    }
  }
}

export function resolveDefaultProvider(): Provider {
  const v = (process.env.DEFAULT_LLM_PROVIDER ?? "openai").toLowerCase();
  if (v === "anthropic" || v === "qwen" || v === "spark" || v === "openai") {
    return v;
  }
  return "openai";
}

export function assertProviderEnv(p: Provider): void {
  switch (p) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) throw new Error("未配置 OPENAI_API_KEY");
      return;
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("未配置 ANTHROPIC_API_KEY");
      return;
    case "qwen":
      if (!process.env.DASHSCOPE_API_KEY) throw new Error("未配置 DASHSCOPE_API_KEY");
      return;
    case "spark":
      if (!process.env.SPARK_API_KEY) throw new Error("未配置 SPARK_API_KEY（讯飞 OpenAI 兼容密钥）");
      return;
    default: {
      const _e: never = p;
      throw new Error(`未知 provider: ${_e}`);
    }
  }
}
