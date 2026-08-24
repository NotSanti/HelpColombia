/**
 * Authorize scheduled ingestion routes.
 * Vercel Cron sends: Authorization: Bearer $CRON_SECRET
 */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }

  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) {
    return false;
  }

  // Constant-time-ish compare for equal-length strings.
  let mismatch = 0;
  for (let i = 0; i < header.length; i += 1) {
    mismatch |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
