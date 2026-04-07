"use client";

import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { PLATFORM_RULES } from "@/lib/prompts/platformRules";
import { joinKeywords } from "@/lib/listing/normalize";
import type { ListingOutput, Platform, Provider, TargetLocale } from "@/lib/validate/schemas";
import type { TranslatedBundle } from "@/lib/validate/translateResult";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "openai", label: "OpenAI (GPT-4o)" },
  { id: "anthropic", label: "Anthropic (Claude 3.5)" },
  { id: "qwen", label: "通义千问" },
  { id: "spark", label: "讯飞星火" },
];

const LOCALE_OPTIONS: { id: TargetLocale; label: string }[] = [
  { id: "es", label: "西班牙语 (es)" },
  { id: "fr", label: "法语 (fr)" },
  { id: "de", label: "德语 (de)" },
  { id: "it", label: "意大利语 (it)" },
  { id: "ja", label: "日语 (ja)" },
  { id: "ko", label: "韩语 (ko)" },
];

const LOCALE_ORDER: TargetLocale[] = ["es", "fr", "de", "it", "ja", "ko"];

type ApiOk<T> = { ok: true; traceId: string } & T;
type ApiErr = { ok: false; traceId: string; error: string };

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function HomePage() {
  const [platform, setPlatform] = useState<Platform>("amazon");
  const [keywords, setKeywords] = useState("");
  const [competitorPaste, setCompetitorPaste] = useState("");
  const [asin, setAsin] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.4);
  const [translateTemperature, setTranslateTemperature] = useState(0.2);
  const [selectedLocales, setSelectedLocales] = useState<TargetLocale[]>(["de", "ja"]);

  const [listing, setListing] = useState<ListingOutput | null>(null);
  const [translations, setTranslations] = useState<TranslatedBundle | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingTr, setLoadingTr] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rule = PLATFORM_RULES[platform];

  const toggleLocale = useCallback((id: TargetLocale) => {
    setSelectedLocales((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const onGenerate = async () => {
    setMessage(null);
    setLoadingGen(true);
    setTranslations(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          keywords,
          competitorPaste,
          asin,
          provider,
          model: model.trim() || undefined,
          temperature,
        }),
      });
      const data: ApiOk<{ listing: ListingOutput }> | ApiErr = await res.json();
      if (!data.ok) {
        setMessage(data.error || "生成失败");
        return;
      }
      setListing(data.listing);
      setMessage(`生成成功 · trace ${data.traceId}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoadingGen(false);
    }
  };

  const onTranslate = async () => {
    if (!listing) {
      setMessage("请先生成英文 Listing");
      return;
    }
    if (selectedLocales.length === 0) {
      setMessage("请至少选择一种目标语言");
      return;
    }
    setMessage(null);
    setLoadingTr(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          sourceEn: {
            title: listing.title,
            bullets: listing.bullets,
            backendKeywords: listing.backendKeywords,
            longTail: listing.longTail,
          },
          targetLocales: selectedLocales,
          provider,
          model: model.trim() || undefined,
          temperature: translateTemperature,
        }),
      });
      const data: ApiOk<{ translations: TranslatedBundle }> | ApiErr = await res.json();
      if (!data.ok) {
        setMessage(data.error || "翻译失败");
        return;
      }
      setTranslations(data.translations);
      setMessage(`翻译成功 · trace ${data.traceId}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoadingTr(false);
    }
  };

  const exportExcel = useCallback(() => {
    if (!listing) {
      setMessage("无可导出的 Listing");
      return;
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const platformLabel = PLATFORM_RULES[platform].label;
    const rows: (string | number)[][] = [];

    const header = [
      "ASIN",
      "Platform",
      "Field",
      "EN",
      ...LOCALE_ORDER.map((l) => l.toUpperCase()),
      "ExportedAt",
    ];
    rows.push(header);

    const T = (field: string, en: string, getter: (loc: TargetLocale) => string) => {
      const tr = (loc: TargetLocale) => {
        if (!translations?.[loc]) return "";
        return getter(loc);
      };
      rows.push([
        asin || "",
        platformLabel,
        field,
        en,
        ...LOCALE_ORDER.map((l) => tr(l)),
        ts,
      ]);
    };

    T("title", listing.title, (loc) => translations?.[loc]?.title ?? "");
    listing.bullets.forEach((b, i) => {
      T(`bullet_${i + 1}`, b, (loc) => translations?.[loc]?.bullets[i] ?? "");
    });
    T("backend_keywords", joinKeywords(listing.backendKeywords), (loc) =>
      translations?.[loc] ? joinKeywords(translations[loc].backendKeywords) : "",
    );

    const maxLt = Math.max(
      listing.longTail.length,
      ...LOCALE_ORDER.map((l) => translations?.[l]?.longTail.length ?? 0),
    );
    for (let i = 0; i < maxLt; i++) {
      const enLt = listing.longTail[i] ?? "";
      T(`longtail_${i + 1}`, enLt, (loc) => translations?.[loc]?.longTail[i] ?? "");
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Listing");
    XLSX.writeFile(wb, `listing-export-${platform}-${ts}.xlsx`);
  }, [asin, listing, platform, translations]);

  const copyAllJson = useCallback(async () => {
    if (!listing) return;
    const payload = {
      platform,
      asin: asin || undefined,
      en: listing,
      translations: translations ?? undefined,
    };
    await copyText(JSON.stringify(payload, null, 2));
    setMessage("已复制完整 JSON");
  }, [asin, listing, platform, translations]);

  const fieldCard = useMemo(() => {
    if (!listing) return null;
    const kw = joinKeywords(listing.backendKeywords);
    return (
      <div className="mt-6 grid gap-4">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">标题</h3>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-white"
              style={{ background: "var(--accent)" }}
              onClick={() => copyText(listing.title)}
            >
              复制
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{listing.title}</p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <h3 className="mb-2 text-sm font-semibold">五点</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {listing.bullets.map((b, i) => (
              <li key={i} className="whitespace-pre-wrap">
                <span>{b}</span>
                <button
                  type="button"
                  className="ml-2 rounded px-2 py-0.5 text-xs text-white"
                  style={{ background: "var(--accent)" }}
                  onClick={() => copyText(b)}
                >
                  复制
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">后台关键词</h3>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-white"
              style={{ background: "var(--accent)" }}
              onClick={() => copyText(kw)}
            >
              复制
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{kw}</p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">长尾词</h3>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-white"
              style={{ background: "var(--accent)" }}
              onClick={() => copyText(listing.longTail.join("\n"))}
            >
              复制全部
            </button>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {listing.longTail.map((t, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {t}
              </li>
            ))}
          </ul>
        </div>
        {listing.notes ? (
          <div
            className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <strong>备注：</strong>
            {listing.notes}
          </div>
        ) : null}
      </div>
    );
  }, [listing]);

  const translationSection = useMemo(() => {
    if (!translations || !listing) return null;
    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-lg font-semibold">多语言结果</h2>
        {selectedLocales.map((loc) => {
          const block = translations[loc];
          if (!block) return null;
          const label = LOCALE_OPTIONS.find((o) => o.id === loc)?.label ?? loc;
          return (
            <div
              key={loc}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{label}</h3>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs text-white"
                  style={{ background: "var(--accent)" }}
                  onClick={() =>
                    copyText(
                      JSON.stringify(
                        {
                          title: block.title,
                          bullets: block.bullets,
                          backendKeywords: joinKeywords(block.backendKeywords),
                          longTail: block.longTail,
                        },
                        null,
                        2,
                      ),
                    )
                  }
                >
                  复制 JSON
                </button>
              </div>
              <p className="mb-2 text-sm font-medium">{block.title}</p>
              <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm">
                {block.bullets.map((b, i) => (
                  <li key={i} className="whitespace-pre-wrap">
                    {b}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                关键词：{joinKeywords(block.backendKeywords)}
              </p>
            </div>
          );
        })}
      </div>
    );
  }, [translations, listing, selectedLocales]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Listing AI 工作台</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          手动粘贴关键词与竞品文案；服务端调用大模型生成英文 Listing 并可选多语言翻译。密钥仅存于{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700">.env.local</code>
        </p>
      </header>

      <section
        className="rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">平台</span>
            <select
              className="rounded-lg border px-3 py-2 text-base"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              {(Object.keys(PLATFORM_RULES) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_RULES[p].label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              标题建议 ≤ {rule.titleMax} 字符；五点 {rule.bulletCount} 条
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">模型服务商</span>
            <select
              className="rounded-lg border px-3 py-2 text-base"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium">核心关键词</span>
          <textarea
            className="min-h-[88px] rounded-lg border px-3 py-2 text-base"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
            placeholder="多条可用逗号或换行分隔"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium">竞品参考（标题 / 五点 / 描述粘贴）</span>
          <textarea
            className="min-h-[140px] rounded-lg border px-3 py-2 text-base"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
            placeholder="可选；不填则仅根据关键词推断"
            value={competitorPaste}
            onChange={(e) => setCompetitorPaste(e.target.value)}
          />
        </label>

        <label className="mt-4 flex flex-col gap-1 text-sm md:w-1/2">
          <span className="font-medium">ASIN（备注）</span>
          <input
            className="rounded-lg border px-3 py-2 text-base"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
            placeholder="仅归档，不拉取页面"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
          />
        </label>

        <details className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
          <summary className="cursor-pointer font-medium">高级：模型 ID / 温度</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span>自定义模型 ID（可选）</span>
              <input
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>生成温度（{temperature}）</span>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span>翻译温度（{translateTemperature}）</span>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={translateTemperature}
                onChange={(e) => setTranslateTemperature(Number(e.target.value))}
              />
            </label>
          </div>
        </details>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loadingGen || !keywords.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
            onClick={() => void onGenerate()}
          >
            {loadingGen ? "生成中…" : "生成英文 Listing"}
          </button>
          {listing ? (
            <>
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)" }}
                onClick={() => void copyAllJson()}
              >
                复制全部 JSON
              </button>
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)" }}
                onClick={exportExcel}
              >
                导出 Excel
              </button>
            </>
          ) : null}
        </div>
      </section>

      {message ? (
        <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{message}</p>
      ) : null}

      {fieldCard}

      {listing ? (
        <section
          className="mt-10 rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <h2 className="text-lg font-semibold">多语言翻译</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            英译：西 / 法 / 德 / 意 / 日 / 韩。勾选语言后点击翻译（与上方同一模型服务商）。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {LOCALE_OPTIONS.map((o) => (
              <label key={o.id} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedLocales.includes(o.id)}
                  onChange={() => toggleLocale(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
            disabled={loadingTr}
            onClick={() => void onTranslate()}
          >
            {loadingTr ? "翻译中…" : "翻译所选语言"}
          </button>
        </section>
      ) : null}

      {translationSection}
    </main>
  );
}
