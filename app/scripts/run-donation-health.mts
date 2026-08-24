import { config } from "dotenv";
import { resolve } from "node:path";
import { ingestDonationHealth } from "../lib/ingestion/donation-health";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const result = await ingestDonationHealth();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

void main();
