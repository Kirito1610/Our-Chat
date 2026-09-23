import { json } from "@/lib/http";

export function GET() { return json({ success: true, status: "ok" }); }
