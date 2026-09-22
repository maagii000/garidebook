// DeepSeek (OpenAI-compatible) chat client.
const BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const KEY = process.env.DEEPSEEK_API_KEY || "";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";

export async function deepseekAsk(system: string, user: string, maxTokens = 2000): Promise<string> {
  if (!KEY) throw new Error("DEEPSEEK_API_KEY тохируулаагүй байна");
  const r = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`DeepSeek алдаа (${r.status}): ${text.slice(0, 200)}`);
  const d = JSON.parse(text);
  const msg = d.choices?.[0]?.message;
  // Reasoning models (deepseek-flash) put output in reasoning_content
  const ans = (msg?.content?.trim() || msg?.reasoning_content?.trim() || "");
  if (!ans) throw new Error("DeepSeek хоосон хариу өглөө");
  return ans;
}
