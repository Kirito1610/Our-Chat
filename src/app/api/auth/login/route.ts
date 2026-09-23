import { signToken } from "@/lib/auth";
import { parseBody, json, routeError } from "@/lib/http";
import { loginSchema } from "@/modules/auth/auth.schema";
import { loginUser } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const user = await loginUser(await parseBody(request, loginSchema));
    return json({ success: true, data: { user, token: await signToken(user.id) } });
  } catch (error) { return routeError(error); }
}
