"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Moodi, type Mood, type MoodiBuddyElement } from "moodi/react";
import { SoundToggle } from "./sound-toggle";
import { useInView } from "./use-in-view";

/*
  Live example: the landing page of a made-up product ("Hush", a journal that asks back).
  moodi isn't decoration here, it shows the state of the UI: a mood picker, a chat
  (listening → thinking → speaking) and a waitlist form (error / loading / success).
*/

const MOOD_LABEL: Record<Mood, string> = {
  idle: "Calm",
  thinking: "Thinking",
  loading: "Working",
  listening: "Listening",
  speaking: "Replying",
  happy: "Happy",
  surprised: "Surprised",
  sad: "Sad",
  error: "Error",
  sleeping: "Asleep",
  love: "In love",
};

const DAY_MOODS: { mood: Mood; label: string }[] = [
  { mood: "happy", label: "Good" },
  { mood: "love", label: "Great" },
  { mood: "idle", label: "Okay" },
  { mood: "sad", label: "Rough" },
  { mood: "sleeping", label: "Tired" },
  { mood: "surprised", label: "Weird day" },
];

const FEATURES: { title: string; text: string; shape: "pebble" | "drop" | "bean"; color: string; mood: Mood }[] = [
  {
    title: "Asks back",
    text: "When you get stuck writing, a single question helps you think your day through.",
    shape: "pebble",
    color: "#f2a07b",
    mood: "thinking",
  },
  {
    title: "Remembers",
    text: "It notices the themes that keep coming back and turns them into a weekly summary.",
    shape: "drop",
    color: "#8ec5e8",
    mood: "love",
  },
  {
    title: "Evening nudge",
    text: "Before bed it quietly reminds you if you haven't written yet. Then it falls asleep too.",
    shape: "bean",
    color: "#b9a3e3",
    mood: "sleeping",
  },
];

type Reply = { text: string; mood: Mood };

function pickReply(input: string): Reply {
  const t = input.toLowerCase();
  if (/tired|sleepy|exhausted|sleep/.test(t))
    return { text: "Long day. What's one thing you could let go of tomorrow?", mood: "sleeping" };
  if (/sad|bad|hard|stress|angry|upset|awful/.test(t))
    return { text: "Thank you for writing it down. What happened? No rush.", mood: "sad" };
  if (/good|great|happy|glad|awesome|nailed|won/.test(t))
    return { text: "That's wonderful! What was the best moment?", mood: "happy" };
  return { text: "I see. If you had to describe today in one word, what would it be?", mood: "idle" };
}

type Message = { id: number; from: "me" | "bot"; text: string };

function useTimers() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => clearTimeout(id));
  }, []);
  return (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
}

function scrollToId(e: { preventDefault: () => void }, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LiveExample() {
  const [sound, setSound] = useState(true);
  const later = useTimers();

  // ---------- Hero: mood picker ----------
  const heroRef = useRef<MoodiBuddyElement>(null);
  const heroInView = useInView(heroRef);
  const [dayMood, setDayMood] = useState<Mood>("idle");

  // ---------- Chat ----------
  const chatRef = useRef<MoodiBuddyElement>(null);
  const chatInView = useInView(chatRef);
  const [chatMood, setChatMood] = useState<Mood>("idle");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  /** the "Hush is typing…" bubble, between sending and the first words of the reply */
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: "Hi! How was your day? Write a few words, I'm listening." },
  ]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const onDraft = (v: string) => {
    setDraft(v);
    if (!busy) setChatMood(v.trim() ? "listening" : "idle");
  };

  /** Canned reply, typed out letter by letter: used when the AI isn't available. */
  const typeOut = (botId: number, reply: Reply) => {
    setTyping(false);
    setChatMood("speaking");
    setMessages((m) => [...m, { id: botId, from: "bot", text: "" }]);
    const step = 24;
    for (let i = 1; i <= reply.text.length; i++) {
      later(() => {
        setMessages((m) => m.map((msg) => (msg.id === botId ? { ...msg, text: reply.text.slice(0, i) } : msg)));
      }, i * step);
    }
    later(() => {
      setChatMood(reply.mood);
      setBusy(false);
    }, reply.text.length * step + 150);
  };

  /**
   * Real replies from /api/chat: the buddy thinks until the first words arrive, speaks while
   * they stream in, then shows the mood the model picked for its answer.
   */
  const askAI = async (history: Message[], botId: number) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history.filter((m) => m.text).map(({ from, text }) => ({ from, text })) }),
    });
    if (res.status === 429) return typeOut(botId, { text: "I need a little breather. Try again in a minute?", mood: "sleeping" });
    if (!res.ok || !res.body) throw new Error(String(res.status));

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let text = "";
    let mood: Mood = "idle";
    let started = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line) as { t?: string; mood?: Mood; error?: string };
        if (msg.error) throw new Error(msg.error);
        if (msg.mood) mood = msg.mood;
        if (msg.t) {
          text += msg.t;
          if (!started) {
            started = true;
            setTyping(false);
            setChatMood("speaking");
            setMessages((m) => [...m, { id: botId, from: "bot", text }]);
          } else {
            const now = text;
            setMessages((m) => m.map((x) => (x.id === botId ? { ...x, text: now } : x)));
          }
        }
      }
    }
    if (!started) throw new Error("empty");
    setChatMood(mood);
    setBusy(false);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const text = draft.trim().slice(0, 300);
    if (!text) {
      chatRef.current?.react("error", { duration: 1000 });
      return;
    }
    const mine: Message = { id: nextId.current++, from: "me", text };
    const history = [...messages, mine];
    setMessages(history);
    setDraft("");
    setBusy(true);
    setTyping(true);
    setChatMood("thinking");

    const botId = nextId.current++;
    askAI(history, botId).catch(() => {
      // no key, offline or a hiccup: the demo still answers, just with canned lines
      setMessages((m) => m.filter((x) => x.id !== botId));
      typeOut(botId, pickReply(text));
    });
  };

  // ---------- Waitlist ----------
  const formRef = useRef<MoodiBuddyElement>(null);
  const formInView = useInView(formRef);
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<"idle" | "typing" | "loading" | "error" | "done">("idle");
  const formMood = ({ idle: "idle", typing: "listening", loading: "loading", error: "error", done: "happy" } as const)[
    formState
  ];

  const join = (e: FormEvent) => {
    e.preventDefault();
    if (formState === "loading") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormState("error");
      return;
    }
    // demo: nothing is submitted, it only shows the loading state
    setFormState("loading");
    later(() => setFormState("done"), 1600);
  };

  const formMessage = {
    idle: "No spam. Unsubscribe anytime.",
    typing: "Listening…",
    loading: "Saving your spot…",
    error: "That doesn't look like a valid email address.",
    done: "You're in! We'll be in touch.",
  }[formState];

  return (
    <div className="site">
      <header className="site-nav">
        <a className="site-logo" href="#example">
          <Moodi shape="ghost" color="#f07167" size={30} shadow={false} interactive={false} loading="eager" />
          Hush
        </a>
        <nav className="site-links">
          <a href="#example" onClick={(e) => scrollToId(e, "features")}>
            Features
          </a>
          <a href="#example" onClick={(e) => scrollToId(e, "try")}>
            Try it
          </a>
          <a href="#example" onClick={(e) => scrollToId(e, "waitlist")}>
            Waitlist
          </a>
        </nav>
        <SoundToggle on={sound} onToggle={() => setSound((v) => !v)} className="inline" />
      </header>

      <section className="site-hero">
        <div>
          <p className="site-kicker">A journal that asks back</p>
          <h1 className="site-title">Write your day. Someone&rsquo;s listening.</h1>
          <p className="site-sub">
            Hush is a tiny companion next to your journal: it listens, asks back, and notices when something keeps coming
            up. Five minutes a day, no ads.
          </p>
          <div className="site-cta">
            <a
              className="btn btn-primary"
              href="#example"
              onClick={(e) => scrollToId(e, "try")}
              onMouseEnter={() => heroRef.current?.react("happy", { duration: 900 })}
            >
              Try it free
            </a>
            <a className="btn btn-ghost" href="#example" onClick={(e) => scrollToId(e, "features")}>
              How does it work?
            </a>
          </div>

          <fieldset className="mood-picker">
            <legend>How are you today?</legend>
            {DAY_MOODS.map((d) => (
              <button key={d.mood} type="button" aria-pressed={dayMood === d.mood} onClick={() => setDayMood(d.mood)}>
                {d.label}
              </button>
            ))}
          </fieldset>
        </div>

        <div className="hero-card">
          <span className="bubble">{MOOD_LABEL[dayMood]}</span>
          <Moodi
            ref={heroRef}
            shape="ghost"
            color="#f07167"
            mood={dayMood}
            size={220}
            sound={sound && heroInView}
            loading="eager"
          />
        </div>
      </section>

      <section className="site-section" id="features">
        <h2 className="site-h2">Three things that make it different.</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature">
              <Moodi shape={f.shape} color={f.color} mood={f.mood} size={84} loading="eager" />
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" id="try">
        <h2 className="site-h2">Try it now.</h2>
        <p className="site-sub narrow">
          Tell Hush about your day and watch the buddy: it listens while you type, thinks while the AI writes back,
          speaks as the answer streams in, then shows the mood the AI picked for its reply.
        </p>
        <div className="chat-wrap">
          <div className="chat">
            <div className="chat-head">
              <span className="chat-dot" aria-hidden />
              <div>
                <strong>Hush</strong>
                <span className="chat-status">{MOOD_LABEL[chatMood]}</span>
              </div>
            </div>
            <div className="chat-list" ref={listRef} aria-live="polite">
              {messages.map((m) => (
                <p key={m.id} className={`msg msg-${m.from}`}>
                  {m.text || "…"}
                </p>
              ))}
              {typing && (
                <p className="msg msg-bot typing" role="status" aria-label="Hush is typing">
                  <span />
                  <span />
                  <span />
                </p>
              )}
            </div>
            <form className="chat-form" onSubmit={send}>
              <input
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                placeholder="Today I feel…"
                aria-label="Message"
                maxLength={300}
                disabled={busy}
              />
              <button className="btn btn-primary" type="submit" disabled={busy}>
                Send
              </button>
            </form>
          </div>
          {/* the buddy gets its own big card, so every state change is easy to see */}
          <div className="chat-buddy">
            <span className="bubble">{MOOD_LABEL[chatMood]}</span>
            <Moodi
              ref={chatRef}
              shape="blob"
              color="#8fb996"
              mood={chatMood}
              size={240}
              sound={sound && chatInView}
              settle={4000}
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section className="site-section" id="waitlist">
        <div className={`waitlist is-${formState}`}>
          <Moodi
            ref={formRef}
            shape="cube"
            color="#f3d36b"
            mood={formMood}
            size={120}
            sound={sound && formInView}
            settle={3000}
            loading="eager"
          />
          <div className="waitlist-body">
            <h2 className="site-h2">Join the waitlist.</h2>
            <form className="waitlist-form" onSubmit={join} noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formState !== "loading" && formState !== "done") setFormState(e.target.value ? "typing" : "idle");
                }}
                placeholder="you@example.com"
                aria-label="Email address"
                aria-invalid={formState === "error"}
                disabled={formState === "loading" || formState === "done"}
              />
              <button className="btn btn-primary" type="submit" disabled={formState === "loading" || formState === "done"}>
                {formState === "loading" ? "Sending…" : formState === "done" ? "Done ✓" : "Join"}
              </button>
            </form>
            <p className="waitlist-msg" role="status">
              {formMessage}
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>© 2026 Hush · a made-up product to show what moodi can do</span>
        <span className="site-footer-moodi">
          <Moodi shape="bean" color="#2b2d42" mood="sleeping" size={40} shadow={false} loading="eager" />
          Good night.
        </span>
      </footer>
    </div>
  );
}
