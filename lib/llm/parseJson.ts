/**
 * 从模型输出中尽量剥出 JSON 字符串（处理 ```json 围栏与前后噪音）。
 */
export function extractJsonString(raw: string): string {
  let s = raw.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)```/im.exec(s);
  if (fenced?.[1]) {
    s = fenced[1].trim();
  }
  const objStart = s.indexOf("{");
  const objEnd = s.lastIndexOf("}");
  if (objStart >= 0 && objEnd > objStart) {
    s = s.slice(objStart, objEnd + 1);
  }
  return s.trim();
}
