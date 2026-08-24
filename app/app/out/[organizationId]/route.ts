import { NextResponse } from "next/server";
import { resolveDonationRedirect } from "@/lib/donations/resolve-destination";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

/**
 * Secure outbound donation redirect.
 * Frontend supplies only an organization identifier — never a destination URL.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await context.params;
  const result = await resolveDonationRedirect(organizationId);

  if (!result.ok) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.redirect(result.url, 302);
}
