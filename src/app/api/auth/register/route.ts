import { signToken } from "@/lib/auth";
import { parseBody, json, routeError } from "@/lib/http";
import { registerSchema } from "@/modules/auth/auth.schema";
import { registerUser } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const user = await registerUser(await parseBody(request, registerSchema));
    return json({ success: true, data: { user, token: await signToken(user.id) } }, 201);
  } catch (error) { return routeError(error); }
}
