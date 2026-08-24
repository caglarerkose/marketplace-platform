import { type NextRequest } from "next/server";
import { handleInvitationCallback } from "@/lib/auth/invitation-callback";

export function GET(request: NextRequest) {
  return handleInvitationCallback(request);
}
