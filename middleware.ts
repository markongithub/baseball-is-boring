import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getUtcMinus10DateString(): string {
  // "Pacific/Honolulu" is effectively UTC-10 year-round (no DST).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Honolulu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/") return NextResponse.next();

  const today = getUtcMinus10DateString();

  const url = req.nextUrl.clone();
  url.pathname = "/schedule";
  url.searchParams.set("sportID", "1");
  url.searchParams.set("date", today);

  const res = NextResponse.redirect(url, 307);
  // Allow edge/CDN to cache the redirect for ~1 hour, but avoid caching on the client.
  res.headers.set("Cache-Control", "public, max-age=0, s-maxage=3600");
  return res;
}

export const config = { matcher: ["/"] };

