/*
  Server-side DataFast goals (https://datafa.st/docs/custom-goals). Needs DATAFAST_API, a df_
  website key that is set on Vercel only: locally, and whenever the visitor has no DataFast
  cookie yet, this is a no-op. Never throws, so analytics can't break a request.
*/

const VISITOR_COOKIE = "datafast_visitor_id";

function visitorId(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function trackGoal(req: Request, name: string, metadata?: Record<string, string>) {
  const key = process.env.DATAFAST_API;
  const visitor = visitorId(req);
  if (!key || !visitor) return;
  try {
    await fetch("https://datafa.st/api/v1/goals", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ datafast_visitor_id: visitor, name, metadata }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // analytics are best-effort
  }
}
