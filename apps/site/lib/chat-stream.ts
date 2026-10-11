import { Output, streamText, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";

// moodi/react is a client module, so the mood list is repeated here
export const MOODS = ["idle", "thinking", "listening", "speaking", "happy", "surprised", "sad", "error", "sleeping", "love"] as const;

const SYSTEM = `You are Hush, a gentle journaling companion in a short website demo.
The user tells you about their day. Reply like a warm, curious friend:
- 1 or 2 short sentences, at most 35 words. Often end with one simple follow-up question.
- Reply in the user's language.
- No lists, no markdown, no emoji.
- You are not a therapist and give no medical, legal or financial advice. If the user mentions
  self-harm or being in danger, kindly encourage them to contact local emergency services or a
  crisis line right away.
- Stay on the topic of the user's day and feelings; politely steer anything else back to it.
Also pick the mood your little 3D buddy shows after your reply:
happy (good news), love (something lovely or heartfelt), sad (something hard), sleeping (they
are tired), surprised (something unexpected), thinking (reflective), listening (they are
mid-story), idle (neutral), error (the message makes no sense).`;

const schema = z.object({
  mood: z.enum(MOODS).describe("How the buddy should look after this reply."),
  reply: z.string().describe("What Hush says. 1-2 short sentences."),
});


/**
 * Streams { mood, reply } from the model as newline-delimited JSON:
 * {"t":"…"} reply chunks, then {"mood":"…"}, or {"error":"…"}.
 */
export function chatStream(model: LanguageModel, messages: ModelMessage[], signal?: AbortSignal) {
  const result = streamText({
    model,
    system: SYSTEM,
    messages,
    output: Output.object({ schema }),
    maxOutputTokens: 200,
    temperature: 0.8,
    abortSignal: signal,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      let sent = 0;
      let mood: string | undefined;
      try {
        for await (const part of result.partialOutputStream) {
          // mood comes first in the schema; once reply has started, mood is complete
          if (typeof part.reply === "string") {
            if (part.mood) mood = part.mood;
            if (part.reply.length > sent) {
              send({ t: part.reply.slice(sent) });
              sent = part.reply.length;
            }
          }
        }
        send({ mood: mood && (MOODS as readonly string[]).includes(mood) ? mood : "idle" });
      } catch (err) {
        console.error("[api/chat] stream failed", err);
        send({ error: "failed" });
      }
      controller.close();
    },
  });
}
