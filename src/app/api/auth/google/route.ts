import { signToken } from "@/lib/auth";
import { json, parseBody, routeError } from "@/lib/http";
import { googleSchema } from "@/modules/auth/auth.schema";
import { loginWithGoogle } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const user = await loginWithGoogle((await parseBody(request, googleSchema)).idToken);
    return json({ success: true, data: { user, token: await signToken(user.id) } });
  } catch (error) { return routeError(error); }
}