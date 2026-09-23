import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const allowedOrigin = process.env.CORS_ORIGIN ?? "*";
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(allowedOrigin) });
  }
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) response.headers.set(key, value);
  return response;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export const config = { matcher: "/api/:path*" };
