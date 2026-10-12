import { openai } from "@ai-sdk/openai";
import { after } from "next/server";
import { z } from "zod";
import { chatStream } from "@/lib/chat-stream";
import { trackGoal } from "@/lib/datafast";

/*
  AI replies for the "Hush" chat on /test. The model returns { mood, reply }: the reply is
  streamed to the page, and the mood tells the moodi buddy how to look once it has finished.
  The OpenAI key stays on the server (OPENAI_API_KEY); without it the page falls back to its
  canned replies.

  Response: newline-delimited JSON. {"t":"…"} is a chunk of reply text, {"mood":"…"} the
  final mood, {"error":"…"} a failure.
*/

export const maxDuration = 30;

const bodySchema = z.object({
  messages: z
    .array(z.object({ from: z.enum(["me", "bot"]), text: z.string() }))
    .min(1)
    .max(40),
});

// Best-effort per-IP limits. In-memory, so they hold per server instance (Fluid compute
// reuses instances); enough to stop casual abuse of a demo.
const WINDOWS = [
  { ms: 60_000, max: 8 },
  { ms: 60 * 60_000, max: 40 },
];
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOWS[WINDOWS.length - 1].ms);
  const over = WINDOWS.some((w) => list.filter((t) => now - t < w.ms).length >= w.max);
  if (!over) list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return over;
}

const json = (status: number, data: object) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export async function POST(req: Request) {
  // only this site may call it
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { error: "forbidden" });

  if (!process.env.OPENAI_API_KEY) return json(503, { error: "not configured" });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return json(429, { error: "slow down" });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "bad request" });

  // the last few turns are plenty of context, and keep the cost flat
  const messages = parsed.data.messages.slice(-8).map((m) => ({
    role: m.from === "me" ? ("user" as const) : ("assistant" as const),
    content: m.text.slice(0, 300),
  }));
  if (messages[messages.length - 1].role !== "user") return json(400, { error: "bad request" });

  // counted once the response is sent, so it never delays the reply
  after(() => trackGoal(req, "hush_chat_message", { turn: String(messages.filter((m) => m.role === "user").length) }));

  const stream = chatStream(openai(process.env.OPENAI_MODEL ?? "gpt-4.1-mini"), messages, req.signal);

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
