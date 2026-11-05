import { NextResponse, type NextRequest } from "next/server";

/** Persian is the default locale and lives at "/" — serve it from /fa without changing the URL. */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/fa";
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/"] };
