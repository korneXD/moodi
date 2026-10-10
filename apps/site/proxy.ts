import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";

// DataFast bot traffic: reports AI crawler hits (GPTBot, ClaudeBot, …) server-side.
// Not awaited; the package uses event.waitUntil, so the response is never delayed.
export function proxy(request: NextRequest, event: NextFetchEvent) {
  trackAICrawlerRequest(request, event, {
    websiteId: "dfid_pssJNAwHn9MWijVTh8hCV",
    authToken: process.env.DATAFAST_BOT_TOKEN,
  });
  return NextResponse.next();
}

export const config = {
  // skip API and static assets; robots.txt, llms.txt and sitemap.xml stay trackable
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
